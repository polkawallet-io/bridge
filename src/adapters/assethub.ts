import { Storage } from "@acala-network/sdk/utils/storage";
import { AnyApi, FixedPointNumber as FN } from "@acala-network/sdk-core";
import { combineLatest, map, Observable } from "rxjs";

import { SubmittableExtrinsic } from "@polkadot/api/types";
import { DeriveBalancesAll } from "@polkadot/api-derive/balances/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { BN } from "@polkadot/util";

import { BalanceAdapter, BalanceAdapterConfigs } from "../balance-adapter";
import { BaseCrossChainAdapter } from "../base-chain-adapter";
import { ChainId, chains } from "../configs";
import { ApiNotFound, InvalidAddress, TokenNotFound } from "../errors";
import { BalanceData, ExtendedToken, TransferParams } from "../types";
import {
  createRouteConfigs,
  validateAddress,
  getDestAccountInfo,
} from "../utils";

export const assetHubPolkadotRouteConfigs = createRouteConfigs(
  "assetHubPolkadot",
  [
    {
      to: "polkadot",
      token: "DOT",
      xcm: {
        fee: { token: "DOT", amount: "421500000" },
        weightLimit: "Unlimited",
      },
    },
    {
      to: "hydradx",
      token: "USDT",
      xcm: {
        fee: { token: "USDT", amount: "2200" },
        weightLimit: "Unlimited",
      },
    },
    {
      to: "acala",
      token: "USDT",
      xcm: {
        fee: { token: "USDT", amount: "808" },
        weightLimit: "Unlimited",
      },
    },
    {
      to: "acala",
      token: "USDC",
      xcm: {
        fee: { token: "USDC", amount: "803" },
        weightLimit: "Unlimited",
      },
    },
    {
      to: "acala",
      token: "PINK",
      xcm: {
        fee: { token: "PINK", amount: "80370000" },
        weightLimit: "Unlimited",
      },
    },
    {
      to: "astar",
      token: "USDT",
      xcm: {
        fee: { token: "USDT", amount: "808" },
        weightLimit: "Unlimited",
      },
    },
    {
      to: "interlay",
      token: "USDT",
      xcm: {
        fee: { token: "USDT", amount: "25000" },
        weightLimit: "Unlimited",
      },
    },
    {
      to: "interlay",
      token: "USDC",
      xcm: {
        fee: { token: "USDC", amount: "25000" },
        weightLimit: "Unlimited",
      },
    },
    {
      to: "moonbeam",
      token: "USDT",
      xcm: {
        fee: { token: "USDT", amount: "808" },
        weightLimit: "Unlimited",
      },
    },
    {
      to: "parallel",
      token: "USDT",
      xcm: {
        fee: { token: "USDT", amount: "808" },
        weightLimit: "Unlimited",
      },
    },
  ]
);

export const assetHubKusamaRouteConfigs = createRouteConfigs("assetHubKusama", [
  {
    to: "kusama",
    token: "KSM",
    xcm: {
      fee: { token: "KSM", amount: "90049287" },
      weightLimit: "Unlimited",
    },
  },
  {
    to: "karura",
    token: "RMRK",
    xcm: {
      fee: { token: "RMRK", amount: "9918117" },
      weightLimit: "Unlimited",
    },
  },
  {
    to: "karura",
    token: "ARIS",
    xcm: {
      fee: { token: "ARIS", amount: "6400000" },
      weightLimit: "Unlimited",
    },
  },
  {
    to: "karura",
    token: "USDT",
    xcm: { fee: { token: "USDT", amount: "808" }, weightLimit: "Unlimited" },
  },
  {
    to: "kintsugi",
    token: "USDT",
    xcm: {
      fee: { token: "USDT", amount: "20000" },
      weightLimit: "Unlimited",
    },
  },
]);

export const assetHubPolkadotTokensConfig: Record<string, ExtendedToken> = {
  DOT: {
    name: "DOT",
    symbol: "DOT",
    decimals: 10,
    ed: "100000000",
    toRaw: () => "NATIVE",
  },
  USDT: {
    name: "USDT",
    symbol: "USDT",
    decimals: 6,
    ed: "700000",
    toRaw: () => new BN(1984),
  },
  USDC: {
    name: "USDC",
    symbol: "USDC",
    decimals: 6,
    ed: "700000",
    toRaw: () => new BN(1337),
  },
  PINK: {
    name: "PINK",
    symbol: "PINK",
    decimals: 10,
    ed: "1",
    toRaw: () => new BN(23),
  },
};

export const assetHubKusamaTokensConfig: Record<string, ExtendedToken> = {
  KSM: {
    name: "KSM",
    symbol: "KSM",
    decimals: 12,
    ed: "79999999",
    toRaw: () => "NATIVE",
  },
  RMRK: {
    name: "RMRK",
    symbol: "RMRK",
    decimals: 10,
    ed: "100000000",
    toRaw: () => new BN(8),
  },
  ARIS: {
    name: "ARIS",
    symbol: "ARIS",
    decimals: 8,
    ed: "10000000",
    toRaw: () => new BN(16),
  },
  USDT: {
    name: "USDT",
    symbol: "USDT",
    decimals: 6,
    ed: "1000",
    toRaw: () => new BN(1984),
  },
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const createBalanceStorages = (api: AnyApi) => {
  return {
    balances: (address: string) =>
      Storage.create<DeriveBalancesAll>({
        api,
        path: "derive.balances.all",
        params: [address],
      }),
    assets: (assetId: BN, address: string) =>
      Storage.create<any>({
        api,
        path: "query.assets.account",
        params: [assetId, address],
      }),
    assetsMeta: (assetId: BN) =>
      Storage.create<any>({
        api,
        path: "query.assets.metadata",
        params: [assetId],
      }),
    assetsInfo: (assetId: BN) =>
      Storage.create<any>({
        api,
        path: "query.assets.asset",
        params: [assetId],
      }),
  };
};

class AssetHubBalanceAdapter extends BalanceAdapter {
  private storages: ReturnType<typeof createBalanceStorages>;

  constructor({ api, chain, tokens }: BalanceAdapterConfigs) {
    super({ api, chain, tokens });
    this.storages = createBalanceStorages(api);
  }

  public subscribeBalance(
    tokenName: string,
    address: string
  ): Observable<BalanceData> {
    if (!validateAddress(address)) throw new InvalidAddress(address);

    const storage = this.storages.balances(address);

    if (tokenName === this.nativeToken) {
      return storage.observable.pipe(
        map((data) => ({
          free: FN.fromInner(data.freeBalance.toString(), this.decimals),
          locked: FN.fromInner(data.lockedBalance.toString(), this.decimals),
          reserved: FN.fromInner(
            data.reservedBalance.toString(),
            this.decimals
          ),
          available: FN.fromInner(
            data.availableBalance.toString(),
            this.decimals
          ),
        }))
      );
    }

    const token: ExtendedToken = this.getToken(tokenName);

    if (!token) throw new TokenNotFound(tokenName);

    return combineLatest({
      meta: this.storages.assetsMeta(token.toRaw()).observable,
      balance: this.storages.assets(token.toRaw(), address).observable,
    }).pipe(
      map(({ balance, meta }) => {
        const amount = FN.fromInner(
          balance.unwrapOrDefault()?.balance?.toString() || "0",
          meta.decimals?.toNumber()
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

class BaseAssetHubAdapter extends BaseCrossChainAdapter {
  private balanceAdapter?: AssetHubBalanceAdapter;

  public async init(api: AnyApi) {
    this.api = api;

    await api.isReady;

    const chain = this.chain.id as ChainId;

    this.balanceAdapter = new AssetHubBalanceAdapter({
      api,
      chain,
      tokens: this.tokens,
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
              amount: FN.ONE,
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
    if (!this.api) throw new ApiNotFound(this.chain.id);

    const { address, amount, to, token: tokenName } = params;

    const { accountId, accountType, addrType } = getDestAccountInfo(
      address,
      tokenName,
      this.api,
      to
    );

    if (!validateAddress(address, addrType)) throw new InvalidAddress(address);

    const toChain = chains[to];

    // to relay chain, support native token
    if (to === "kusama" || to === "polkadot") {
      if (tokenName !== this.balanceAdapter?.nativeToken) {
        throw new TokenNotFound(tokenName);
      }

      const dst = { interior: "Here", parents: 1 };
      const acc = {
        interior: { X1: { AccountId32: { id: accountId } } },
        parents: 0,
      };
      const ass = [
        {
          id: {
            Concrete: { interior: "Here", parents: 1 },
          },
          fun: { Fungible: amount.toChainData() },
        },
      ];

      return this.api?.tx.polkadotXcm.limitedTeleportAssets(
        { V3: dst } as any,
        { V3: acc } as any,
        { V3: ass } as any,
        0,
        this.getDestWeight(tokenName, to)?.toString() as any
      );
    }

    // to others
    const token = this.getToken(tokenName) as ExtendedToken;

    if (tokenName === this.balanceAdapter?.nativeToken || !token) {
      throw new TokenNotFound(tokenName);
    }

    const dst = {
      parents: 1,
      interior: { X1: { Parachain: toChain.paraChainId } },
    };
    const acc = {
      parents: 0,
      interior: {
        X1: {
          [accountType]: {
            [accountType === "AccountId32" ? "id" : "key"]: accountId,
          },
        },
      },
    };
    const ass = [
      {
        id: {
          Concrete: {
            parents: 0,
            interior: {
              X2: [{ PalletInstance: 50 }, { GeneralIndex: token.toRaw() }],
            },
          },
        },
        fun: {
          Fungible: amount.toChainData(),
        },
      },
    ];

    return this.api?.tx.polkadotXcm.limitedReserveTransferAssets(
      { V3: dst } as any,
      { V3: acc } as any,
      { V3: ass } as any,
      0,
      this.getDestWeight(tokenName, to)?.toString() as any
    );
  }
}

export class AssetHubPolkadotAdapter extends BaseAssetHubAdapter {
  constructor() {
    super(
      chains.assetHubPolkadot,
      assetHubPolkadotRouteConfigs,
      assetHubPolkadotTokensConfig
    );
  }
}

export class AssetHubKusamaAdapter extends BaseAssetHubAdapter {
  constructor() {
    super(
      chains.assetHubKusama,
      assetHubKusamaRouteConfigs,
      assetHubKusamaTokensConfig
    );
  }
}
