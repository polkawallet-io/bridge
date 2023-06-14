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
import { BalanceData, BasicToken, TransferParams } from "../types";
import { createRouteConfigs, validateAddress } from "../utils";

export const statemintRouteConfigs = createRouteConfigs("statemint", [
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
]);

export const statemineRouteConfigs = createRouteConfigs("statemine", [
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
    to: "basilisk",
    token: "USDT",
    xcm: {
      fee: { token: "USDT", amount: "3177" },
      weightLimit: "Unlimited",
    },
  },
]);

export const statemintTokensConfig: Record<
  string,
  Record<string, BasicToken>
> = {
  statemint: {
    DOT: { name: "DOT", symbol: "DOT", decimals: 10, ed: "10000000000" },
    USDT: { name: "USDT", symbol: "USDT", decimals: 6, ed: "1000" },
  },
  statemine: {
    KSM: { name: "KSM", symbol: "KSM", decimals: 12, ed: "79999999" },
    RMRK: { name: "RMRK", symbol: "RMRK", decimals: 10, ed: "100000000" },
    ARIS: { name: "ARIS", symbol: "ARIS", decimals: 8, ed: "10000000" },
    USDT: { name: "USDT", symbol: "USDT", decimals: 6, ed: "1000" },
  },
};

export const SUPPORTED_TOKENS: Record<string, BN> = {
  RMRK: new BN(8),
  ARIS: new BN(16),
  USDT: new BN(1984),
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

class StatemintBalanceAdapter extends BalanceAdapter {
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

    const storage = this.storages.balances(address);

    if (token === this.nativeToken) {
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

    const assetId = SUPPORTED_TOKENS[token];

    if (assetId === undefined) {
      throw new TokenNotFound(token);
    }

    return combineLatest({
      meta: this.storages.assetsMeta(assetId).observable,
      balance: this.storages.assets(assetId, address).observable,
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

class BaseStatemintAdapter extends BaseCrossChainAdapter {
  private balanceAdapter?: StatemintBalanceAdapter;

  public async init(api: AnyApi) {
    this.api = api;

    await api.isReady;

    const chain = this.chain.id as ChainId;

    this.balanceAdapter = new StatemintBalanceAdapter({
      api,
      chain,
      tokens: statemintTokensConfig[chain],
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

  private get isV0V1() {
    try {
      const keys = (this.api?.createType("XcmVersionedMultiLocation") as any)
        .defKeys as string[];

      return keys.includes("V0");
    } catch (e) {
      // ignore error
    }

    return false;
  }

  public createTx(
    params: TransferParams
  ):
    | SubmittableExtrinsic<"promise", ISubmittableResult>
    | SubmittableExtrinsic<"rxjs", ISubmittableResult> {
    if (!this.api) throw new ApiNotFound(this.chain.id);

    const { address, amount, to, token } = params;

    if (!validateAddress(address)) throw new InvalidAddress(address);

    const toChain = chains[to];

    const accountId = this.api?.createType("AccountId32", address).toHex();

    // to relay chain
    if (to === "kusama" || to === "polkadot") {
      // to relay chain only support native token
      if (token !== this.balanceAdapter?.nativeToken) {
        throw new TokenNotFound(token);
      }

      const isV0V1Support = this.isV0V1;

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
        { [isV0V1Support ? "V1" : "V3"]: dst } as any,
        { [isV0V1Support ? "V1" : "V3"]: acc } as any,
        { [isV0V1Support ? "V1" : "V3"]: ass } as any,
        0,
        this.getDestWeight(token, to)?.toString() as any
      );
    }

    // to karura/acala
    const assetId = SUPPORTED_TOKENS[token];

    if (token === this.balanceAdapter?.nativeToken || !assetId) {
      throw new TokenNotFound(token);
    }

    const dst = {
      parents: 1,
      interior: { X1: { Parachain: toChain.paraChainId } },
    };
    const acc = {
      parents: 0,
      interior: { X1: { AccountId32: { id: accountId } } },
    };
    const ass = [
      {
        id: {
          Concrete: {
            parents: 0,
            interior: {
              X2: [{ PalletInstance: 50 }, { GeneralIndex: assetId }],
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
      this.getDestWeight(token, to)?.toString() as any
    );
  }
}

export class StatemintAdapter extends BaseStatemintAdapter {
  constructor() {
    super(
      chains.statemint,
      statemintRouteConfigs,
      statemintTokensConfig.statemint
    );
  }
}

export class StatemineAdapter extends BaseStatemintAdapter {
  constructor() {
    super(
      chains.statemine,
      statemineRouteConfigs,
      statemintTokensConfig.statemine
    );
  }
}
