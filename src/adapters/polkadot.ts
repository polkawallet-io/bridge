import { Storage } from "@acala-network/sdk/utils/storage";
import { AnyApi, FixedPointNumber as FN } from "@acala-network/sdk-core";
import { combineLatest, map, Observable } from "rxjs";

import { SubmittableExtrinsic } from "@polkadot/api/types";
import { DeriveBalancesAll } from "@polkadot/api-derive/balances/types";
import { ISubmittableResult } from "@polkadot/types/types";

import { BalanceAdapter, BalanceAdapterConfigs } from "../balance-adapter";
import { BaseCrossChainAdapter } from "../base-chain-adapter";
import { ChainId, chains } from "../configs";
import { ApiNotFound, InvalidAddress, TokenNotFound } from "../errors";
import { BalanceData, BasicToken, TransferParams } from "../types";
import {
  createRouteConfigs,
  getDestAccountInfo,
  validateAddress,
} from "../utils";

export const polkadotRouteConfigs = createRouteConfigs("polkadot", [
  {
    to: "acala",
    token: "DOT",
    xcm: {
      fee: { token: "DOT", amount: "1222070" },
      deliveryFee: { token: "DOT", amount: "397000000" },
      weightLimit: "Unlimited",
    },
  },
  {
    to: "hydradx",
    token: "DOT",
    xcm: {
      deliveryFee: { token: "DOT", amount: "397000000" },
      fee: { token: "DOT", amount: "21711791" },
      weightLimit: "Unlimited",
    },
  },
  {
    to: "assetHubPolkadot",
    token: "DOT",
    xcm: {
      deliveryFee: { token: "DOT", amount: "397000000" },
      fee: { token: "DOT", amount: "15800000" },
      weightLimit: "Unlimited",
    },
  },
  {
    to: "interlay",
    token: "DOT",
    xcm: {
      deliveryFee: { token: "DOT", amount: "397000000" },
      fee: { token: "DOT", amount: "25000000" },
      weightLimit: "Unlimited",
    },
  },
]);

export const kusamaRouteConfigs = createRouteConfigs("kusama", [
  {
    to: "karura",
    token: "KSM",
    xcm: {
      fee: { token: "KSM", amount: "44163610" },
      deliveryFee: { token: "KSM", amount: "1323333009" },
      weightLimit: "Unlimited",
    },
  },
  {
    to: "basilisk",
    token: "KSM",
    xcm: {
      fee: { token: "KSM", amount: "72711796" },
      deliveryFee: { token: "KSM", amount: "1323333009" },
      weightLimit: "Unlimited",
    },
  },
  {
    to: "assetHubKusama",
    token: "KSM",
    xcm: {
      fee: { token: "KSM", amount: "34368318" },
      deliveryFee: { token: "KSM", amount: "1323333009" },
      weightLimit: "Unlimited",
    },
  },
  {
    to: "kintsugi",
    token: "KSM",
    xcm: {
      fee: { token: "KSM", amount: "250000000" },
      deliveryFee: { token: "KSM", amount: "1323333009" },
      weightLimit: "Unlimited",
    },
  },
]);

const polkadotTokensConfig: Record<string, Record<string, BasicToken>> = {
  polkadot: {
    DOT: { name: "DOT", symbol: "DOT", decimals: 10, ed: "10000000000" },
  },
  kusama: {
    KSM: { name: "KSM", symbol: "KSM", decimals: 12, ed: "79999999" },
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
    if (!validateAddress(address)) throw new InvalidAddress(address);

    const storage = this.storages.balances(address);

    if (token !== this.nativeToken) {
      throw new TokenNotFound(token);
    }

    return storage.observable.pipe(
      map((data) => ({
        free: FN.fromInner(data.freeBalance.toString(), this.decimals),
        locked: FN.fromInner(data.lockedBalance.toString(), this.decimals),
        reserved: FN.fromInner(data.reservedBalance.toString(), this.decimals),
        available: FN.fromInner(
          data.availableBalance.toString(),
          this.decimals
        ),
      }))
    );
  }
}

class BasePolkadotAdapter extends BaseCrossChainAdapter {
  private balanceAdapter?: PolkadotBalanceAdapter;

  public async init(api: AnyApi) {
    this.api = api;

    await api.isReady;

    const chain = this.chain.id as ChainId;

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
    to: ChainId
  ): Observable<FN> {
    if (!this.balanceAdapter) {
      throw new ApiNotFound(this.chain.id);
    }

    const xcmDeliveryFee = this.getXcmDeliveryFee(token, to);

    return combineLatest({
      txFee: this.estimateTxFee({
        amount: FN.ZERO,
        to,
        token,
        address,
        signer: address,
      }),
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
        const deliveryFee = xcmDeliveryFee?.balance || FN.ZERO;

        // always minus ed
        return balance
          .minus(fee)
          .minus(deliveryFee)
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

    const { address, amount, to, token } = params;

    const { accountId, accountType, addrType } = getDestAccountInfo(
      address,
      token,
      this.api,
      to
    );

    if (!validateAddress(address, addrType)) throw new InvalidAddress(address);

    const toChain = chains[to];

    if (token !== this.balanceAdapter?.nativeToken) {
      throw new TokenNotFound(token);
    }

    // to asset hub
    if (to === "assetHubKusama" || to === "assetHubPolkadot") {
      const dst = {
        interior: { X1: { ParaChain: toChain.paraChainId } },
        parents: 0,
      };
      const acc = {
        interior: {
          X1: {
            AccountId32: {
              id: accountId,
              network: undefined,
            },
          },
        },
        parents: 0,
      };
      const ass = [
        {
          fun: { Fungible: amount.toChainData() },
          id: { Concrete: { interior: "Here", parents: 0 } },
        },
      ];

      return this.api?.tx.xcmPallet.limitedTeleportAssets(
        { V3: dst },
        { V3: acc },
        { V3: ass },
        0,
        "Unlimited"
      );
    }

    const dst = {
      parents: 0,
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
        id: { Concrete: { parents: 0, interior: "Here" } },
        fun: { Fungible: amount.toChainData() },
      },
    ];

    return this.api?.tx.xcmPallet.limitedReserveTransferAssets(
      { V3: dst },
      { V3: acc },
      { V3: ass },
      0,
      this.getDestWeight(token, to)?.toString()
    );
  }
}

export class PolkadotAdapter extends BasePolkadotAdapter {
  constructor() {
    super(chains.polkadot, polkadotRouteConfigs, polkadotTokensConfig.polkadot);
  }
}

export class KusamaAdapter extends BasePolkadotAdapter {
  constructor() {
    super(chains.kusama, kusamaRouteConfigs, polkadotTokensConfig.kusama);
  }
}
