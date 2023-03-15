import { Storage } from "@acala-network/sdk/utils/storage";
import { AnyApi, FixedPointNumber as FN } from "@acala-network/sdk-core";
import { combineLatest, map, Observable } from "rxjs";

import { SubmittableExtrinsic } from "@polkadot/api/types";
import { DeriveBalancesAll } from "@polkadot/api-derive/balances/types";
import { ISubmittableResult } from "@polkadot/types/types";

import { BalanceAdapter, BalanceAdapterConfigs } from "../balance-adapter";
import { BaseCrossChainAdapter } from "../base-chain-adapter";
import { ChainId, chains } from "../configs";
import { ApiNotFound, TokenNotFound } from "../errors";
import {
  BalanceData,
  BasicToken,
  RouteConfigs,
  TransferParams,
} from "../types";

export const astarRoutersConfig: Omit<RouteConfigs, "from">[] = [
  {
    to: "acala",
    token: "ASTR",
    xcm: {
      fee: { token: "ASTR", amount: "9269600000000000" },
      weightLimit: "Unlimited",
    },
  },
  {
    to: "acala",
    token: "ACA",
    xcm: {
      fee: { token: "ACA", amount: "9269600000" },
      weightLimit: "Unlimited",
    },
  },
  {
    to: "acala",
    token: "AUSD",
    xcm: {
      fee: { token: "AUSD", amount: "2931921869" },
      weightLimit: "Unlimited",
    },
  },
  {
    to: "acala",
    token: "LDOT",
    xcm: {
      fee: { token: "LDOT", amount: "31449750" },
      weightLimit: "Unlimited",
    },
  },
];

export const shidenRoutersConfig: Omit<RouteConfigs, "from">[] = [
  {
    to: "karura",
    token: "SDN",
    xcm: {
      fee: { token: "SDN", amount: "932400000000000" },
      weightLimit: "Unlimited",
    },
  },
  {
    to: "karura",
    token: "KUSD",
    xcm: {
      fee: { token: "KUSD", amount: "3826597686" },
      weightLimit: "Unlimited",
    },
  },
];

export const astarTokensConfig: Record<string, Record<string, BasicToken>> = {
  astar: {
    ASTR: { name: "ASTR", symbol: "ASTR", decimals: 18, ed: "1000000" },
    ACA: { name: "ACA", symbol: "ACA", decimals: 12, ed: "1" },
    AUSD: { name: "AUSD", symbol: "AUSD", decimals: 12, ed: "1" },
    LDOT: { name: "LDOT", symbol: "LDOT", decimals: 10, ed: "1" },
  },
  shiden: {
    SDN: { name: "SDN", symbol: "SDN", decimals: 18, ed: "1000000" },
    KUSD: { name: "KUSD", symbol: "KUSD", decimals: 12, ed: "1" },
  },
};

const SUPPORTED_TOKENS: Record<string, string> = {
  // to karura
  KUSD: "18446744073709551616",
  // to acala
  ACA: "18446744073709551616",
  AUSD: "18446744073709551617",
  LDOT: "18446744073709551618",
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
    assets: (tokenId: string, address: string) =>
      Storage.create<any>({
        api,
        path: "query.assets.account",
        params: [tokenId, address],
      }),
  };
};

class AstarBalanceAdapter extends BalanceAdapter {
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

    const tokenId = SUPPORTED_TOKENS[token];

    if (tokenId === undefined) {
      throw new TokenNotFound(token);
    }

    return this.storages.assets(tokenId, address).observable.pipe(
      map((balance) => {
        const amount = FN.fromInner(
          balance.unwrapOrDefault()?.balance?.toString() || "0",
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

class BaseAstarAdapter extends BaseCrossChainAdapter {
  private balanceAdapter?: AstarBalanceAdapter;

  public async init(api: AnyApi) {
    this.api = api;

    await api.isReady;

    const chain = this.chain.id as ChainId;

    this.balanceAdapter = new AstarBalanceAdapter({
      chain,
      api,
      tokens: astarTokensConfig[chain],
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
    if (this.api === undefined) {
      throw new ApiNotFound(this.chain.id);
    }

    const { address, amount, to, token } = params;
    const toChain = chains[to];

    const accountId = this.api?.createType("AccountId32", address).toHex();

    const dst = {
      parents: 1,
      interior: { X1: { Parachain: toChain.paraChainId } },
    };
    const acc = {
      parents: 0,
      interior: { X1: { AccountId32: { id: accountId, network: "Any" } } },
    };
    let ass: any = [
      {
        id: { Concrete: { parents: 0, interior: "Here" } },
        fun: { Fungible: amount.toChainData() },
      },
    ];

    if (token === this.balanceAdapter?.nativeToken) {
      return this.api?.tx.polkadotXcm.reserveTransferAssets(
        { V1: dst },
        { V1: acc },
        { V1: ass },
        0
      );
    }

    const tokenIds: Record<string, string> = {
      // to karura
      KUSD: "0x0081",
      // to acala
      ACA: "0x0000",
      AUSD: "0x0001",
      LDOT: "0x0003",
    };

    const tokenId = tokenIds[token];

    if (tokenId === undefined) {
      throw new TokenNotFound(token);
    }

    ass = [
      {
        id: {
          Concrete: {
            parents: 1,
            interior: {
              X2: [{ Parachain: toChain.paraChainId }, { GeneralKey: tokenId }],
            },
          },
        },
        fun: { Fungible: amount.toChainData() },
      },
    ];

    return this.api?.tx.polkadotXcm.reserveWithdrawAssets(
      { V1: dst },
      { V1: acc },
      { V1: ass },
      0
    );
  }
}

export class AstarAdapter extends BaseAstarAdapter {
  constructor() {
    super(chains.astar, astarRoutersConfig, astarTokensConfig.astar);
  }
}

export class ShidenAdapter extends BaseAstarAdapter {
  constructor() {
    super(chains.shiden, shidenRoutersConfig, astarTokensConfig.shiden);
  }
}
