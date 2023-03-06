import { Storage } from "@acala-network/sdk/utils/storage";
import { AnyApi, FixedPointNumber as FN } from "@acala-network/sdk-core";
import { combineLatest, map, Observable } from "rxjs";

import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";

import { BalanceAdapter, BalanceAdapterConfigs } from "../balance-adapter";
import { BaseCrossChainAdapter } from "../base-chain-adapter";
import { ChainName, chains } from "../configs";
import { ApiNotFound, CurrencyNotFound } from "../errors";
import {
  BalanceData,
  BasicToken,
  CrossChainRouterConfigs,
  CrossChainTransferParams,
} from "../types";
import { isChainEqual } from "../utils/is-chain-equal";

const DEST_WEIGHT = "180000000000";

export const interlayRoutersConfig: Omit<CrossChainRouterConfigs, "from">[] = [
  {
    to: "polkadot",
    token: "DOT",
    xcm: {
      fee: { token: "DOT", amount: "1000000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "statemint",
    token: "USDT",
    xcm: {
      // fees from tests with chopsticks: 700_000 atomic units
      fee: { token: "USDT", amount: "1000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
];

export const kintsugiRoutersConfig: Omit<CrossChainRouterConfigs, "from">[] = [
  {
    to: "kusama",
    token: "KSM",
    xcm: {
      fee: { token: "KSM", amount: "1000000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "statemine",
    token: "USDT",
    xcm: {
      fee: { token: "USDT", amount: "10000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "heiko",
    token: "KBTC",
    xcm: {
      // from local tests on choptsicks: actual fees sat around 103
      fee: { token: "KBTC", amount: "200" },
      weightLimit: DEST_WEIGHT,
    },
  },
];

export const interlayTokensConfig: Record<
  string,
  Record<string, BasicToken>
> = {
  interlay: {
    DOT: { name: "DOT", symbol: "DOT", decimals: 10, ed: "0" },
    USDT: { name: "USDT", symbol: "USDT", decimals: 6, ed: "0" },
  },
  kintsugi: {
    KSM: { name: "KSM", symbol: "KSM", decimals: 12, ed: "0" },
    USDT: { name: "USDT", symbol: "USDT", decimals: 6, ed: "0" },
    KBTC: { name: "KBTC", symbol: "KBTC", decimals: 8, ed: "0" },
  },
};

const KINTSUGI_SUPPORTED_TOKENS: Record<string, unknown> = {
  KSM: { Token: "KSM" },
  KBTC: { Token: "KBTC" },
  USDT: { ForeignAsset: 3 },
};

const INTERLAY_SUPPORTED_TOKENS: Record<string, unknown> = {
  DOT: { Token: "DOT" },
  USDT: { ForeignAsset: 2 },
};

const getSupportedTokens = (chainname: string): Record<string, unknown> => {
  return chainname === "interlay"
    ? INTERLAY_SUPPORTED_TOKENS
    : KINTSUGI_SUPPORTED_TOKENS;
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const createBalanceStorages = (api: AnyApi) => {
  return {
    assets: (address: string, token: unknown) =>
      Storage.create<any>({
        api,
        path: "query.tokens.accounts",
        params: [address, token],
      }),
  };
};

class InterlayBalanceAdapter extends BalanceAdapter {
  private storages: ReturnType<typeof createBalanceStorages>;

  constructor({ api, chain, tokens }: BalanceAdapterConfigs) {
    super({ api, chain, tokens });
    this.storages = createBalanceStorages(api);
  }

  public subscribeBalance(
    token: string,
    address: string
  ): Observable<BalanceData> {
    const tokenId = getSupportedTokens(this.chain)[token];

    if (tokenId === undefined) {
      throw new CurrencyNotFound(token);
    }

    return this.storages.assets(address, tokenId).observable.pipe(
      map((balance) => {
        const amount = FN.fromInner(
          balance.free?.toString() || "0",
          this.getToken(token).decimals
        );

        return {
          free: amount,
          locked: new FN(0),
          reserved: new FN(0),
          available: amount,
        };
      })
    );
  }
}

class BaseInterlayAdapter extends BaseCrossChainAdapter {
  private balanceAdapter?: InterlayBalanceAdapter;

  public override async setApi(api: AnyApi) {
    this.api = api;

    await api.isReady;

    const chain = this.chain.id as ChainName;

    this.balanceAdapter = new InterlayBalanceAdapter({
      chain,
      api,
      tokens: interlayTokensConfig[chain],
    });
  }

  public subscribeTokenBalance(
    token: string,
    address: string
  ): Observable<BalanceData> {
    if (!this.balanceAdapter) {
      throw new ApiNotFound(this.chain.id);
    }

    return this.balanceAdapter.subscribeBalance(token, address);
  }

  public subscribeMaxInput(
    token: string,
    address: string,
    to: ChainName
  ): Observable<FN> {
    if (!this.balanceAdapter) {
      throw new ApiNotFound(this.chain.id);
    }

    return combineLatest({
      txFee:
        token === this.balanceAdapter?.nativeToken
          ? this.estimateTxFee({
              amount: FN.ZERO,
              to,
              token,
              address,
              signer: address,
            })
          : "0",
      balance: this.balanceAdapter
        .subscribeBalance(token, address)
        .pipe(map((i) => i.available)),
    }).pipe(
      map(({ balance, txFee }) => {
        const tokenMeta = this.balanceAdapter?.getToken(token);
        const feeFactor = 1.2;
        const fee = FN.fromInner(txFee, tokenMeta?.decimals).mul(
          new FN(feeFactor)
        );

        // always minus ed
        return balance
          .minus(fee)
          .minus(FN.fromInner(tokenMeta?.ed || "0", tokenMeta?.decimals));
      })
    );
  }

  public createTx(
    params: CrossChainTransferParams
  ):
    | SubmittableExtrinsic<"promise", ISubmittableResult>
    | SubmittableExtrinsic<"rxjs", ISubmittableResult> {
    if (this.api === undefined) {
      throw new ApiNotFound(this.chain.id);
    }

    const { address, amount, to, token } = params;
    const toChain = chains[to];

    const accountId = this.api?.createType("AccountId32", address).toHex();

    const tokenId = getSupportedTokens(this.chain.id)[token];

    if (tokenId === undefined) {
      throw new CurrencyNotFound(token);
    }

    // to other parachains
    let dst: any = {
      parents: 1,
      interior: {
        X2: [
          { Parachain: toChain.paraChainId },
          { AccountId32: { id: accountId, network: "Any" } },
        ],
      },
    };

    // to relay-chain
    if (isChainEqual(toChain, "kusama") || isChainEqual(toChain, "polkadot")) {
      dst = {
        interior: { X1: { AccountId32: { id: accountId, network: "Any" } } },
        parents: 1,
      };
    }

    return this.api.tx.xTokens.transfer(
      tokenId,
      amount.toChainData(),
      {
        V1: dst,
      },
      this.getDestWeight(token, to)?.toString()
    );
  }
}

export class InterlayAdapter extends BaseInterlayAdapter {
  constructor() {
    super(
      chains.interlay,
      interlayRoutersConfig,
      interlayTokensConfig.interlay
    );
  }
}

export class KintsugiAdapter extends BaseInterlayAdapter {
  constructor() {
    super(
      chains.kintsugi,
      kintsugiRoutersConfig,
      interlayTokensConfig.kintsugi
    );
  }
}
