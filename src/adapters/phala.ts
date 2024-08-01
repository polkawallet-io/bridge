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
import { BalanceData, ExtendedToken, TransferParams } from "../types";
import {
  createRouteConfigs,
  validateAddress,
  getDestAccountInfo,
} from "../utils";

export const phalaRouteConfigs = createRouteConfigs("phala", [
  {
    to: "interlay",
    token: "PHA",
    xcm: {
      fee: { token: "PHA", amount: "80000000000000" },
    },
  },
  {
    to: "interlay",
    token: "IBTC",
    xcm: {
      fee: { token: "IBTC", amount: "70" },
    },
  },
  {
    to: "interlay",
    token: "INTR",
    xcm: {
      fee: { token: "INTR", amount: "20000000" },
    },
  },
]);


export const khalaRouteConfigs = createRouteConfigs("khala", [
  {
    to: "karura",
    token: "PHA",
    xcm: {
      fee: { token: "PHA", amount: "51200000000" },
    },
  },
  {
    to: "karura",
    token: "KUSD",
    xcm: {
      fee: { token: "KUSD", amount: "4616667257" },
    },
  },
  {
    to: "karura",
    token: "KAR",
    xcm: {
      fee: { token: "KAR", amount: "6400000000" },
    },
  },
]);

export const phalaTokensConfig: Record<string, ExtendedToken> = {
  PHA: {
    name: "PHA",
    symbol: "PHA",
    decimals: 12,
    ed: "10000000000",
    toRaw: () => undefined,
  },
  IBTC: {
    name: "IBTC",
    symbol: "IBTC",
    decimals: 8,
    ed: "1000000",
    toRaw: () =>
      "0x0001000000000000000000000000000000000000000000000000000000000000",
  },
  INTR: {
    name: "INTR",
    symbol: "INTR",
    decimals: 10,
    ed: "100000000",
    toRaw: () =>
      "0x0002000000000000000000000000000000000000000000000000000000000000",
  },
};

export const khalaTokensConfig: Record<string, ExtendedToken> = {
  PHA: {
    name: "PHA",
    symbol: "PHA",
    decimals: 12,
    ed: "40000000000",
    toRaw: () => undefined,
  },
  KAR: {
    name: "KAR",
    symbol: "KAR",
    decimals: 12,
    ed: "10000000000",
    toRaw: () =>
      "0x0080000000000000000000000000000000000000000000000000000000000000",
  },
  KUSD: {
    name: "KUSD",
    symbol: "KUSD",
    decimals: 12,
    ed: "10000000000",
    toRaw: () =>
      "0x0081000000000000000000000000000000000000000000000000000000000000",
  },
};

const tokensConfig: Record<
  string,
  Record<string, ExtendedToken>
> = {
  khala: khalaTokensConfig,
  phala: phalaTokensConfig,
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
    assets: (tokenId: number, address: string) =>
      Storage.create<any>({
        api,
        path: "query.assets.account",
        params: [tokenId, address],
      }),
  };
};

class PhalaBalanceAdapter extends BalanceAdapter {
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

    const SUPPORTED_TOKENS: Record<string, number> = {
      KAR: 1,
      KUSD: 4,
      INTR: 13,
      IBTC: 14
    };
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

class BasePhalaAdapter extends BaseCrossChainAdapter {
  private balanceAdapter?: PhalaBalanceAdapter;

  public async init(api: AnyApi) {
    this.api = api;

    await api.isReady;

    this.balanceAdapter = new PhalaBalanceAdapter({
      chain: this.chain.id as ChainId,
      api,
      tokens: tokensConfig[this.chain.id],
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

    const dst = {
      parents: 1,
      interior: {
        X2: [
          { Parachain: toChain.paraChainId },
          {
            [accountType]: {
              [accountType === "AccountId32" ? "id" : "key"]: accountId,
            },
          },
        ],
      },
    };

    let asset: any = {
      id: { Concrete: { parents: 0, interior: "Here" } },
      fun: { Fungible: amount.toChainData() },
    };

    if (token !== this.balanceAdapter?.nativeToken) {
      const tokenData: ExtendedToken = this.getToken(token);

      if (!tokenData) throw new TokenNotFound(token);

      asset = {
        id: {
          Concrete: {
            parents: 1,
            interior: {
              X2: [
                { Parachain: toChain.paraChainId },
                { GeneralKey: { length: 2, data: tokenData.toRaw() } },
              ],
            },
          },
        },
        fun: { Fungible: amount.toChainData() },
      };
    }

    return this.api.tx.xTransfer.transfer(asset, dst, undefined);
  }
}

export class PhalaAdapter extends BasePhalaAdapter {
  constructor() {
    super(chains.phala, phalaRouteConfigs, phalaTokensConfig);
  }
}

export class KhalaAdapter extends BasePhalaAdapter {
  constructor() {
    super(chains.khala, khalaRouteConfigs, khalaTokensConfig);
  }
}
