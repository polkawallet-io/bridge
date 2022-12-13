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

const DEST_WEIGHT = "5000000000";

export const interlayRoutersConfig: Omit<CrossChainRouterConfigs, "from">[] = [
  {
    to: "acala",
    token: "INTR",
    xcm: {
      fee: { token: "INTR", amount: "93240000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "acala",
    token: "IBTC",
    xcm: { fee: { token: "IBTC", amount: "9" }, weightLimit: DEST_WEIGHT },
  },
];

export const kintsugiRoutersConfig: Omit<CrossChainRouterConfigs, "from">[] = [
  {
    to: "karura",
    token: "KINT",
    xcm: {
      fee: { token: "KINT", amount: "170666666" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "karura",
    token: "KBTC",
    xcm: { fee: { token: "KBTC", amount: "85" }, weightLimit: DEST_WEIGHT },
  },
  {
    to: "karura",
    token: "LKSM",
    xcm: {
      fee: { token: "LKSM", amount: "647055467" },
      weightLimit: DEST_WEIGHT,
    },
  },
];

export const interlayTokensConfig: Record<
  string,
  Record<string, BasicToken>
> = {
  interlay: {
    INTR: { name: "INTR", symbol: "INTR", decimals: 10, ed: "0" },
    IBTC: { name: "IBTC", symbol: "IBTC", decimals: 8, ed: "0" },
  },
  kintsugi: {
    KINT: { name: "KINT", symbol: "KINT", decimals: 12, ed: "0" },
    KBTC: { name: "KBTC", symbol: "KBTC", decimals: 8, ed: "0" },
    LKSM: { name: "LKSM", symbol: "LKSM", decimals: 12, ed: "0" },
  },
};

const SUPPORTED_TOKENS: Record<string, unknown> = {
  KINT: { Token: "KINT" },
  KBTC: { Token: "KBTC" },
  INTR: { Token: "INTR" },
  IBTC: { Token: "IBTC" },
  LKSM: { ForeignAsset: 2 },
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
    const tokenId = SUPPORTED_TOKENS[token];

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

    const tokenId = SUPPORTED_TOKENS[token];

    if (tokenId === undefined) {
      throw new CurrencyNotFound(token);
    }

    return this.api.tx.xTokens.transfer(
      tokenId,
      amount.toChainData(),
      {
        V1: {
          parents: 1,
          interior: {
            X2: [
              { Parachain: toChain.paraChainId },
              { AccountId32: { id: accountId, network: "Any" } },
            ],
          },
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.getDestWeight(token, to)!.toString()
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
