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
  validateAddress,
  createRouteConfigs,
  getDestAccountInfo,
  createXTokensAssetsParam,
  createXTokensDestParam,
} from "../utils";

type TokenData = ExtendedToken & { toQuery: () => string };

export const astarRouteConfigs = createRouteConfigs("astar", [
  {
    to: "acala",
    token: "ASTR",
    xcm: {
      fee: { token: "ASTR", amount: "8082400000000000" },
      weightLimit: "Unlimited",
    },
  },
  {
    to: "acala",
    token: "ACA",
    xcm: {
      fee: { token: "ACA", amount: "8082400000" },
      weightLimit: "Unlimited",
    },
  },
  {
    to: "acala",
    token: "AUSD",
    xcm: {
      fee: { token: "AUSD", amount: "1815098681" },
      weightLimit: "Unlimited",
    },
  },
  {
    to: "acala",
    token: "LDOT",
    xcm: {
      fee: { token: "LDOT", amount: "13400229" },
      weightLimit: "Unlimited",
    },
  },
  {
    to: "hydradx",
    token: "ASTR",
    xcm: {
      fee: { token: "ASTR", amount: "44306118000000000" },
      weightLimit: "Unlimited",
    },
  },
  {
    to: "statemint",
    token: "USDT",
    xcm: {
      fee: { token: "USDT", amount: "44306118000000000" },
      weightLimit: "Unlimited",
    },
  },
]);

export const shidenRouteConfigs = createRouteConfigs("shiden", [
  {
    to: "karura",
    token: "SDN",
    xcm: {
      fee: { token: "SDN", amount: "801280000000000" },
      weightLimit: "Unlimited",
    },
  },
  {
    to: "karura",
    token: "KUSD",
    xcm: {
      fee: { token: "KUSD", amount: "2120203588" },
      weightLimit: "Unlimited",
    },
  },
]);

export const astarTokensConfig: Record<string, Record<string, TokenData>> = {
  astar: {
    ASTR: {
      name: "ASTR",
      symbol: "ASTR",
      decimals: 18,
      ed: "1000000",
    } as TokenData,
    ACA: {
      name: "ACA",
      symbol: "ACA",
      decimals: 12,
      ed: "1",
      toRaw: () =>
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      toQuery: () => "18446744073709551616",
    },
    AUSD: {
      name: "AUSD",
      symbol: "AUSD",
      decimals: 12,
      ed: "1",
      toRaw: () =>
        "0x0001000000000000000000000000000000000000000000000000000000000000",
      toQuery: () => "18446744073709551617",
    },
    USDT: {
      name: "USDT",
      symbol: "USDT",
      decimals: 6,
      ed: "1",
      toRaw: () =>
        "0x0001000000000000000000000000000000000000000000000000000000000000", // TODO: update
      toQuery: () => "4294969280",
    },
    LDOT: {
      name: "LDOT",
      symbol: "LDOT",
      decimals: 10,
      ed: "1",
      toRaw: () => "1984",
      toQuery: () => "18446744073709551618",
    },
  },
  shiden: {
    SDN: {
      name: "SDN",
      symbol: "SDN",
      decimals: 18,
      ed: "1000000",
    } as TokenData,
    KUSD: {
      name: "KUSD",
      symbol: "KUSD",
      decimals: 12,
      ed: "1",
      toRaw: () =>
        "0x0081000000000000000000000000000000000000000000000000000000000000",
      toQuery: () => "18446744073709551616",
    },
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

    const tokenData: TokenData = this.getToken(token);

    if (!tokenData) throw new TokenNotFound(token);

    return this.storages.assets(tokenData.toQuery(), address).observable.pipe(
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

    if (token === this.balanceAdapter?.nativeToken) {
      return this.api.tx.xTokens.transferMultiasset(
        {
          V3: {
            id: { Concrete: { parents: 0, interior: "Here" } },
            fun: { Fungible: amount.toChainData() },
          },
        },
        {
          V3: {
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
          },
        } as any,
        "Unlimited"
      );
    }

    const tokenData: TokenData = this.getToken(params.token);

    if (tokenData.symbol === "USDT") {
      return this.api.tx.xTokens.transferMultiasset(
        createXTokensAssetsParam(
          this.api,
          toChain.paraChainId,
          tokenData.toRaw(),
          amount.toChainData()
        ),
        createXTokensDestParam(this.api, toChain.paraChainId, accountId) as any,
        "Unlimited"
      );
    }

    return this.api.tx.xTokens.transferMultiasset(
      {
        V3: {
          fun: { Fungible: amount.toChainData() },
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
        },
      },
      {
        V3: {
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
        },
      } as any,
      "Unlimited"
    );
  }
}

export class AstarAdapter extends BaseAstarAdapter {
  constructor() {
    super(chains.astar, astarRouteConfigs, astarTokensConfig.astar);
  }
}

export class ShidenAdapter extends BaseAstarAdapter {
  constructor() {
    super(chains.shiden, shidenRouteConfigs, astarTokensConfig.shiden);
  }
}
