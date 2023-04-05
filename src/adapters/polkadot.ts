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
import { supportsV0V1Multilocation } from "../utils/polkadotXcm-multilocation-check";

export const polkadotRoutersConfig: Omit<CrossChainRouterConfigs, "from">[] = [
  {
    to: "interlay",
    token: "DOT",
    xcm: {
      fee: { token: "DOT", amount: "1000000000" },
      weightLimit: "Unlimited",
    },
  },
];
export const kusamaRoutersConfig: Omit<CrossChainRouterConfigs, "from">[] = [
  {
    to: "kintsugi",
    token: "KSM",
    xcm: {
      // fees in chopsticks test: 161_648_000 - add 10x buffer
      fee: { token: "KSM", amount: "1616480000" },
      weightLimit: "Unlimited",
    },
  },
];

const polkadotTokensConfig: Record<string, Record<string, BasicToken>> = {
  polkadot: {
    DOT: { name: "DOT", symbol: "DOT", decimals: 10, ed: "10000000000" },
  },
  interlay: {
    DOT: { name: "DOT", symbol: "DOT", decimals: 10, ed: "10000000000" },
  },
  kusama: {
    KSM: { name: "KSM", symbol: "KSM", decimals: 12, ed: "333333333" },
  },
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const createBalanceStorages = (api: AnyApi) => {
  // TODO: this works with polkadot/api 9.10.2, remember to return to this after upgrade
  // return {
  //   balances: (address: string) =>
  //     Storage.create<DeriveBalancesAll>({
  //       api,
  //       path: "derive.balances.all",
  //       params: [address],
  //     }),
  // };
  return {
    balances: (address: string) =>
      Storage.create<any>({
        api,
        path: "query.system.account",
        params: [address],
      }),
  };
};

class PolkadotBalanceAdapter extends BalanceAdapter {
  private storages: ReturnType<typeof createBalanceStorages>;

  constructor({ api, chain, tokens }: BalanceAdapterConfigs) {
    super({ chain, api, tokens });

    this.storages = createBalanceStorages(api);
  }

  public subscribeBalance(
    token: string,
    address: string
  ): Observable<BalanceData> {
    const storage = this.storages.balances(address);

    if (token !== this.nativeToken) {
      throw new CurrencyNotFound(token);
    }

    // TODO: remember to change back once we upgrade to polkadot 9.10.2 or higher.
    return storage.observable.pipe(
      map((data) => {
        const free = FN.fromInner(data.data.free.toString(), this.decimals);
        const locked = FN.fromInner(
          data.data.miscFrozen.toString(),
          this.decimals
        );
        const reserved = FN.fromInner(
          data.data.reserved.toString(),
          this.decimals
        );
        const available = free.sub(locked);
        return {
          free,
          locked,
          reserved,
          available,
        };
      })
    );
  }
}

class BasePolkadotAdapter extends BaseCrossChainAdapter {
  private balanceAdapter?: PolkadotBalanceAdapter;

  public override async setApi(api: AnyApi) {
    this.api = api;

    await api.isReady;

    const chain = this.chain.id as ChainName;

    this.balanceAdapter = new PolkadotBalanceAdapter({
      chain,
      api,
      tokens: polkadotTokensConfig[chain],
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
      balance: this.balanceAdapter
        .subscribeBalance(token, address)
        .pipe(map((i) => i.available)),
    }).pipe(
      map(({ balance }) => {
        // fixed fee of 0.05 ksm or DOT until we get paymentinfo to work again
        const fee = FN.fromInner(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          0.05 * Math.pow(10, tokenMeta!.decimals),
          tokenMeta?.decimals
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

    if (token !== this.balanceAdapter?.nativeToken) {
      throw new CurrencyNotFound(token);
    }

    const accountId = this.api?.createType("AccountId32", address).toHex();

    const [dst, acc, ass] = supportsV0V1Multilocation(this.api)
      ? [
          { V0: { X1: { Parachain: toChain.paraChainId } } },
          { V0: { X1: { AccountId32: { id: accountId, network: "Any" } } } },
          { V0: [{ ConcreteFungible: { amount: amount.toChainData() } }] },
        ]
      : [
          {
            V3: {
              parents: 0,
              interior: { X1: { Parachain: toChain.paraChainId } },
            },
          },
          {
            V3: {
              parents: 0,
              interior: { X1: { AccountId32: { id: accountId } } },
            },
          },
          {
            V3: [
              {
                fun: { Fungible: amount.toChainData() },
                id: { Concrete: { parents: 0, interior: "Here" } },
              },
            ],
          },
        ];

    if (to === "kintsugi") {
      return this.api?.tx.xcmPallet.reserveTransferAssets(dst, acc, ass, 0);
    }

    // to other parachain
    return this.api?.tx.xcmPallet.limitedReserveTransferAssets(
      dst,
      acc,
      ass,
      0,
      this.getDestWeight(token, to)?.toString()
    );
  }
}

export class PolkadotAdapter extends BasePolkadotAdapter {
  constructor() {
    super(
      chains.polkadot,
      polkadotRoutersConfig,
      polkadotTokensConfig.polkadot
    );
  }
}

export class KusamaAdapter extends BasePolkadotAdapter {
  constructor() {
    super(chains.kusama, kusamaRoutersConfig, polkadotTokensConfig.kusama);
  }
}
