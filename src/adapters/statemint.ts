import { Storage } from "@acala-network/sdk/utils/storage";
import { AnyApi, FixedPointNumber as FN } from "@acala-network/sdk-core";
import { combineLatest, map, Observable } from "rxjs";

import { SubmittableExtrinsic } from "@polkadot/api/types";
import { DeriveBalancesAll } from "@polkadot/api-derive/balances/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { BN } from "@polkadot/util";

import { BalanceAdapter, BalanceAdapterConfigs } from "../balance-adapter";
import { BaseCrossChainAdapter } from "../base-chain-adapter";
import { ChainName, chains } from "../configs";
import {
  ApiNotFound,
  CurrencyNotFound,
  DestinationWeightNotFound,
} from "../errors";
import {
  BalanceData,
  BasicToken,
  CrossChainRouterConfigs,
  CrossChainTransferParams,
} from "../types";
import { supportsV0V1Multilocation } from "../utils/xcm-versioned-multilocation-check";

export const statemintRoutersConfig: Omit<CrossChainRouterConfigs, "from">[] = [
  {
    to: "polkadot",
    token: "DOT",
    xcm: {
      // chopsticks test: 364_421_524 - use 10x buffer
      fee: { token: "DOT", amount: "3644215240" },
      weightLimit: "Unlimited",
    },
  },
  {
    to: "interlay",
    token: "USDT",
    // from recent tests: 11_888 atomic units, use a minimum of 2x buffer
    xcm: { fee: { token: "USDT", amount: "25000" }, weightLimit: "Unlimited" },
  },
  {
    to: "interlay",
    token: "USDC",
    // currently unknown until registered, assume similar to USDT for now
    xcm: { fee: { token: "USDC", amount: "25000" }, weightLimit: "Unlimited" },
  },
];

export const statemineRoutersConfig: Omit<CrossChainRouterConfigs, "from">[] = [
  {
    to: "kintsugi",
    token: "KSM",
    xcm: {
      // chopsticks test: 91_761_280 - use 10x buffer
      fee: { token: "KSM", amount: "917612800" },
      weightLimit: "Unlimited",
    },
  },
  {
    to: "kintsugi",
    token: "USDT",
    // fees from tests on chopsticks: 8_153 planck, add a minimum of 2x buffer
    xcm: { fee: { token: "USDT", amount: "20000" }, weightLimit: "Unlimited" },
  },
];

export const statemineTokensConfig: Record<
  string,
  Record<string, BasicToken>
> = {
  statemine: {
    KSM: { name: "KSM", symbol: "KSM", decimals: 12, ed: "33333333" },
    // ED set according to minBalance value of assets.asset(1984)
    USDT: { name: "USDT", symbol: "USDT", decimals: 6, ed: "1000" },
  },
  statemint: {
    DOT: { name: "DOT", symbol: "DOT", decimals: 10, ed: "1000000000" },
    // ED set according to minBalance value of assets.asset(1337)
    USDC: { name: "USDC", symbol: "USDC", decimals: 6, ed: "70000" },
    // ED set according to minBalance value of assets.asset(1984)
    USDT: { name: "USDT", symbol: "USDT", decimals: 6, ed: "70000" },
  },
};

const SUPPORTED_TOKENS: Record<string, BN> = {
  RMRK: new BN(8),
  ARIS: new BN(16),
  USDC: new BN(1337),
  USDT: new BN(1984),
  KSM: new BN(1984),
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
      throw new CurrencyNotFound(token);
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

  public override async setApi(api: AnyApi) {
    this.api = api;

    await api.isReady;

    const chain = this.chain.id as ChainName;

    this.balanceAdapter = new StatemintBalanceAdapter({
      api,
      chain,
      tokens: statemineTokensConfig[chain],
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

    const destWeight = this.getDestWeight(token, to);
    if (destWeight === undefined) {
      throw new DestinationWeightNotFound(this.chain.id, to, token);
    }

    // to relay chain, support native token
    if (to === "kusama" || to === "polkadot") {
      if (token !== this.balanceAdapter?.nativeToken) {
        throw new CurrencyNotFound(token);
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
        this.getDestWeight(token, to)?.toString() as any
      );
    }

    const assetId = SUPPORTED_TOKENS[token];
    if (
      (to !== "kintsugi" && to !== "interlay") ||
      (to === "interlay" && token === this.balanceAdapter?.nativeToken) ||
      !assetId
    ) {
      throw new CurrencyNotFound(token);
    }

    const [dst, acc, ass] = supportsV0V1Multilocation(this.api)
      ? [
          { V0: { X2: ["Parent", { Parachain: toChain.paraChainId }] } },
          { V0: { X1: { AccountId32: { id: accountId, network: "Any" } } } },
          {
            V0: [
              {
                ConcreteFungible: {
                  id: {
                    X2: [{ PalletInstance: 50 }, { GeneralIndex: assetId }],
                  },
                  amount: amount.toChainData(),
                },
              },
            ],
          },
        ]
      : [
          {
            V3: {
              parents: 1,
              interior: { X1: { Parachain: toChain.paraChainId } },
            },
          } as any,
          {
            V3: {
              parents: 0,
              interior: { X1: { AccountId32: { id: accountId } } },
            },
          } as any,
          {
            V3: [
              {
                fun: { Fungible: amount.toChainData() },
                id: {
                  Concrete: {
                    parents: 0,
                    interior: {
                      X2: [{ PalletInstance: 50 }, { GeneralIndex: assetId }],
                    },
                  },
                },
              },
            ],
          } as any,
        ];

    return this.api?.tx.polkadotXcm.limitedReserveTransferAssets(
      dst,
      acc,
      ass,
      0,
      destWeight
    );
  }
}

export class StatemintAdapter extends BaseStatemintAdapter {
  constructor() {
    super(
      chains.statemint,
      statemintRoutersConfig,
      statemineTokensConfig.statemint
    );
  }
}

export class StatemineAdapter extends BaseStatemintAdapter {
  constructor() {
    super(
      chains.statemine,
      statemineRoutersConfig,
      statemineTokensConfig.statemine
    );
  }
}
