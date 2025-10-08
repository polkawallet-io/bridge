import { Storage } from "@acala-network/sdk/utils/storage";
import { AnyApi, FixedPointNumber as FN } from "@acala-network/sdk-core";
import { combineLatest, map, Observable } from "rxjs";

import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";

import { BalanceAdapter, BalanceAdapterConfigs } from "../balance-adapter";
import { BaseCrossChainAdapter } from "../base-chain-adapter";
import { ChainId, chains } from "../configs";
import { ApiNotFound, TokenNotFound, InvalidAddress } from "../errors";
import { BalanceData, ExtendedToken, TransferParams } from "../types";
import { createRouteConfigs, validateAddress } from "../utils";

const DEST_WEIGHT = "5000000000";

export const interlayRouteConfigs = createRouteConfigs("interlay", [
  {
    to: "acala",
    token: "INTR",
    xcm: {
      fee: { token: "INTR", amount: "81000000" },
    },
  },
  {
    to: "acala",
    token: "IBTC",
    xcm: { fee: { token: "IBTC", amount: "9" } },
  },
  {
    to: "astar",
    token: "INTR",
    xcm: {
      fee: { token: "INTR", amount: "40000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "astar",
    token: "IBTC",
    xcm: { fee: { token: "IBTC", amount: "5" }, weightLimit: DEST_WEIGHT },
  },
  {
    to: "phala",
    token: "PHA",
    xcm: { fee: { token: "PHA", amount: "65000000000" } },
  },
  {
    to: "phala",
    token: "INTR",
    xcm: { fee: { token: "INTR", amount: "650000000" } },
  },
  {
    to: "phala",
    token: "IBTC",
    xcm: { fee: { token: "IBTC", amount: "6500000" } },
  },
  {
    to: "polkadot",
    token: "DOT",
    xcm: {
      fee: { token: "DOT", amount: "1000000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "assetHubPolkadot",
    token: "USDC",
    xcm: {
      fee: { token: "USDC", amount: "80000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "assetHubPolkadot",
    token: "USDT",
    xcm: { fee: { token: "USDT", amount: "80000" } },
  },
  {
    to: "hydradx",
    token: "IBTC",
    xcm: { fee: { token: "IBTC", amount: "15" } },
  },
  {
    to: "hydradx",
    token: "INTR",
    xcm: {
      fee: { token: "INTR", amount: "1500000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "hydradx",
    token: "HDX",
    xcm: {
      fee: { token: "HDX", amount: "100000000000" },
    },
  },
  {
    to: "bifrostPolkadot",
    token: "VDOT",
    xcm: {
      fee: { token: "VDOT", amount: "725" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "bifrostPolkadot",
    token: "BNC",
    xcm: {
      fee: { token: "BNC", amount: "550000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
]);

export const kintsugiRouteConfigs = createRouteConfigs("kintsugi", [
  {
    to: "karura",
    token: "KINT",
    xcm: {
      fee: { token: "KINT", amount: "210000000" },
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
      fee: { token: "LKSM", amount: "270000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "assetHubKusama",
    token: "USDT",
    xcm: {
      fee: { token: "USDT", amount: "10000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "bifrost",
    token: "VKSM",
    xcm: {
      fee: { token: "VKSM", amount: "85000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
]);

export const interlayTokensConfig: Record<
  string,
  Record<string, ExtendedToken>
> = {
  interlay: {
    INTR: {
      name: "INTR",
      symbol: "INTR",
      decimals: 10,
      ed: "0",
      toRaw: () => ({ Token: "INTR" }),
    },
    IBTC: {
      name: "IBTC",
      symbol: "IBTC",
      decimals: 8,
      ed: "0",
      toRaw: () => ({ Token: "IBTC" }),
    },
    DOT: {
      name: "DOT",
      symbol: "DOT",
      decimals: 10,
      ed: "0",
      toRaw: () => ({ Token: "DOT" }),
    },
    USDC: {
      name: "USDC",
      symbol: "USDC",
      decimals: 6,
      ed: "0",
      toRaw: () => ({ ForeignAsset: 12 }),
    },
    HDX: {
      name: "HDX",
      symbol: "HDX",
      decimals: 12,
      ed: "0",
      toRaw: () => ({ ForeignAsset: 13 }),
    },
    USDT: {
      name: "USDT",
      symbol: "USDT",
      decimals: 6,
      ed: "0",
      toRaw: () => ({ ForeignAsset: 2 }),
    },
    VDOT: {
      name: "VDOT",
      symbol: "VDOT",
      decimals: 10,
      ed: "0",
      toRaw: () => ({ ForeignAsset: 3 }),
    },
    BNC: {
      name: "BNC",
      symbol: "BNC",
      decimals: 12,
      ed: "0",
      toRaw: () => ({ ForeignAsset: 11 }),
    },
    PHA: {
      name: "PHA",
      symbol: "PHA",
      decimals: 12,
      ed: "10000000000",
      toRaw: () => ({ ForeignAsset: 14 }),
    },
  },
  kintsugi: {
    KINT: {
      name: "KINT",
      symbol: "KINT",
      decimals: 12,
      ed: "0",
      toRaw: () => ({ Token: "KINT" }),
    },
    KBTC: {
      name: "KBTC",
      symbol: "KBTC",
      decimals: 8,
      ed: "0",
      toRaw: () => ({ Token: "KBTC" }),
    },
    KSM: {
      name: "KSM",
      symbol: "KSM",
      decimals: 12,
      ed: "0",
      toRaw: () => ({ Token: "DOT" }),
    },
    LKSM: {
      name: "LKSM",
      symbol: "LKSM",
      decimals: 12,
      ed: "0",
      toRaw: () => ({ ForeignAsset: 2 }),
    },
    USDT: {
      name: "USDT",
      symbol: "USDT",
      decimals: 6,
      ed: "0",
      toRaw: () => ({ ForeignAsset: 3 }),
    },
    VKSM: {
      name: "VKSM",
      symbol: "VKSM",
      decimals: 12,
      ed: "0",
      toRaw: () => ({ ForeignAsset: 5 }),
    },
  },
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
    if (!validateAddress(address)) throw new InvalidAddress(address);

    const tokenData: ExtendedToken = this.getToken(token);

    if (!tokenData) throw new TokenNotFound(token);

    return this.storages.assets(address, tokenData.toRaw()).observable.pipe(
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

  public async init(api: AnyApi) {
    this.api = api;

    await api.isReady;

    const chain = this.chain.id as ChainId;

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
    to: ChainId
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
    params: TransferParams
  ):
    | SubmittableExtrinsic<"promise", ISubmittableResult>
    | SubmittableExtrinsic<"rxjs", ISubmittableResult> {
    return this.createXTokensTx(params);
  }
}

export class InterlayAdapter extends BaseInterlayAdapter {
  constructor() {
    super(chains.interlay, interlayRouteConfigs, interlayTokensConfig.interlay);
  }
}

export class KintsugiAdapter extends BaseInterlayAdapter {
  constructor() {
    super(chains.kintsugi, kintsugiRouteConfigs, interlayTokensConfig.kintsugi);
  }
}
