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
import { xTokensHelper } from "../utils/xtokens-helper";

const DEST_WEIGHT = "Unlimited";

export const bifrostKusamaRoutersConfig: Omit<
  CrossChainRouterConfigs,
  "from"
>[] = [
  {
    to: "kintsugi",
    token: "VKSM",
    xcm: {
      // tested in chopsticks: fees were 166_363_195. Add 10x margin
      fee: { token: "VKSM", amount: "1663631950" },
      weightLimit: DEST_WEIGHT,
    },
  },
];

export const bifrostPolkadotRoutersConfig: Omit<
  CrossChainRouterConfigs,
  "from"
>[] = [
  {
    to: "interlay",
    token: "VDOT",
    xcm: {
      // taken from transaction: fees were 18_012_501. Add 10x margin
      fee: { token: "VDOT", amount: "180125010" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "interlay",
    token: "BNC",
    xcm: {
      // chopsticks test value: 48_800_000_000, add buffer
      fee: { token: "BNC", amount: "500000000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
];

export const bifrostKusamaTokensConfig: Record<string, BasicToken> = {
  BNC: { name: "BNC", symbol: "BNC", decimals: 12, ed: "10000000000" },
  VKSM: { name: "VKSM", symbol: "VKSM", decimals: 12, ed: "100000000" },
};

export const bifrostPolkadotTokensConfig: Record<string, BasicToken> = {
  BNC: { name: "BNC", symbol: "BNC", decimals: 12, ed: "10000000000" },
  VDOT: { name: "VDOT", symbol: "VDOT", decimals: 10, ed: "1000000" },
};

const SUPPORTED_KUSAMA_TOKENS: Record<string, unknown> = {
  BNC: { Native: "BNC" },
  VKSM: { VToken: "KSM" },
};

const SUPPORTED_POLKADOT_TOKENS: Record<string, unknown> = {
  BNC: { Native: "BNC" },
  VDOT: { VToken2: 0 },
};

const getSupportedTokens = (chainname: string): Record<string, unknown> => {
  return chainname === "bifrost_polkadot"
    ? SUPPORTED_POLKADOT_TOKENS
    : SUPPORTED_KUSAMA_TOKENS;
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const createBalanceStorages = (api: AnyApi) => {
  return {
    balances: (address: string) =>
      Storage.create<any>({
        api,
        path: "query.system.account",
        params: [address],
      }),
    assets: (address: string, token: unknown) =>
      Storage.create<any>({
        api,
        path: "query.tokens.accounts",
        params: [address, token],
      }),
  };
};

class BifrostBalanceAdapter extends BalanceAdapter {
  private storages: ReturnType<typeof createBalanceStorages>;

  constructor({ api, chain, tokens }: BalanceAdapterConfigs) {
    super({ api, chain, tokens });
    this.storages = createBalanceStorages(api);
  }

  public subscribeBalance(
    token: string,
    address: string
  ): Observable<BalanceData> {
    const storage = this.storages.balances(address);

    if (token === this.nativeToken) {
      return storage.observable.pipe(
        map(({ data }) => ({
          free: FN.fromInner(data.free.toString(), this.decimals),
          locked: FN.fromInner(data.miscFrozen.toString(), this.decimals),
          reserved: FN.fromInner(data.reserved.toString(), this.decimals),
          available: FN.fromInner(
            data.free.sub(data.miscFrozen).toString(),
            this.decimals
          ),
        }))
      );
    }

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

class BaseBifrostAdapter extends BaseCrossChainAdapter {
  private balanceAdapter?: BifrostBalanceAdapter;

  public override async setApi(api: AnyApi) {
    this.api = api;

    await api.isReady;

    const tokensConfig =
      this.chain.id === "bifrost_polkadot"
        ? bifrostPolkadotTokensConfig
        : bifrostKusamaTokensConfig;

    this.balanceAdapter = new BifrostBalanceAdapter({
      chain: this.chain.id as ChainName,
      api,
      tokens: tokensConfig,
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

    const accountId = this.api.createType("AccountId32", address).toHex();

    const tokenId = getSupportedTokens(this.chain.id)[token];

    if (tokenId === undefined) {
      throw new CurrencyNotFound(token);
    }

    return xTokensHelper.transfer(
      this.api,
      this.chain,
      toChain,
      accountId,
      token,
      tokenId,
      amount,
      this.getDestWeight(token, to) || "Unlimited"
    );
  }
}

export class BifrostKusamaAdapter extends BaseBifrostAdapter {
  constructor() {
    super(
      chains.bifrost,
      bifrostKusamaRoutersConfig,
      bifrostKusamaTokensConfig
    );
  }
}

export class BifrostPolkadotAdapter extends BaseBifrostAdapter {
  constructor() {
    super(
      chains.bifrost_polkadot,
      bifrostPolkadotRoutersConfig,
      bifrostPolkadotTokensConfig
    );
  }
}
