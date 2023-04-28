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
  ExpandToken,
  RouteConfigs,
  TransferParams,
} from "../types";

const DEST_WEIGHT = "5000000000";

export const basiliskRoutersConfig: Omit<RouteConfigs, "from">[] = [
  {
    to: "kusama",
    token: "KSM",
    xcm: {
      fee: { token: "KSM", amount: "11523248" },
      weightLimit: "800000000",
    },
  },
  {
    to: "karura",
    token: "BSX",
    xcm: {
      fee: { token: "BSX", amount: "93240000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "karura",
    token: "KUSD",
    xcm: {
      fee: { token: "KUSD", amount: "5060238106" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "karura",
    token: "KSM",
    xcm: {
      fee: { token: "KSM", amount: "90741527" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "karura",
    token: "DAI",
    xcm: {
      fee: { token: "DAI", amount: "808240000000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "karura",
    token: "USDCet",
    xcm: {
      fee: { token: "USDCet", amount: "808" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "karura",
    token: "WETH",
    xcm: {
      fee: { token: "WETH", amount: "449022222222" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "karura",
    token: "WBTC",
    xcm: {
      fee: { token: "WBTC", amount: "2" },
      weightLimit: DEST_WEIGHT,
    },
  },
];

export const basiliskTokensConfig: Record<string, ExpandToken> = {
  BSX: {
    name: "BSX",
    symbol: "BSX",
    decimals: 12,
    ed: "1000000000000",
    toChainData: () => 0,
  },
  KUSD: {
    name: "KUSD",
    symbol: "KUSD",
    decimals: 12,
    ed: "10000000000",
    toChainData: () => 2,
  },
  KSM: {
    name: "KSM",
    symbol: "KSM",
    decimals: 12,
    ed: "100000000",
    toChainData: () => 1,
  },
  DAI: {
    name: "DAI",
    symbol: "DAI",
    decimals: 18,
    ed: "10000000000",
    toChainData: () => 13,
  },
  USDCet: {
    name: "USDCet",
    symbol: "USDCet",
    decimals: 6,
    ed: "10000",
    toChainData: () => 9,
  },
  WETH: {
    name: "WETH",
    symbol: "WETH",
    decimals: 18,
    ed: "6230529595016",
    toChainData: () => 10,
  },
  WBTC: {
    name: "WBTC",
    symbol: "WBTC",
    decimals: 8,
    ed: "33",
    toChainData: () => 11,
  },
};

export const hydraRoutersConfig: Omit<RouteConfigs, "from">[] = [
  {
    to: "acala",
    token: "DAI",
    xcm: {
      fee: { token: "DAI", amount: "808240000000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "acala",
    token: "WETH",
    xcm: {
      fee: { token: "WETH", amount: "687004000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "acala",
    token: "WBTC",
    xcm: {
      fee: { token: "WBTC", amount: "4" },
      weightLimit: DEST_WEIGHT,
    },
  },
];

export const hydraTokensConfig: Record<string, ExpandToken> = {
  DAI: {
    name: "DAI",
    symbol: "DAI",
    decimals: 18,
    ed: "10000000000",
    toChainData: () => 2,
  },
  WETH: {
    name: "WETH",
    symbol: "WETH",
    decimals: 18,
    ed: "7000000000000",
    toChainData: () => 4,
  },
  WBTC: {
    name: "WBTC",
    symbol: "WBTC",
    decimals: 8,
    ed: "44",
    toChainData: () => 3,
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
    assets: (tokenId: number, address: string) =>
      Storage.create<any>({
        api,
        path: "query.tokens.accounts",
        params: [address, tokenId],
      }),
  };
};

class HydradxBalanceAdapter extends BalanceAdapter {
  private storages: ReturnType<typeof createBalanceStorages>;

  constructor({ api, chain, tokens }: BalanceAdapterConfigs) {
    super({ api, chain, tokens });
    this.storages = createBalanceStorages(api);
  }

  public subscribeBalance(
    tokenName: string,
    address: string
  ): Observable<BalanceData> {
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

    const token = this.getToken<ExpandToken>(tokenName);

    return this.storages.assets(token.toChainData(), address).observable.pipe(
      map((balance) => {
        const amount = FN.fromInner(
          balance.free?.toString() || "0",
          token.decimals
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

class BaseHydradxAdapter extends BaseCrossChainAdapter {
  private balanceAdapter?: HydradxBalanceAdapter;

  public async init(api: AnyApi) {
    this.api = api;

    await api.isReady;

    this.balanceAdapter = new HydradxBalanceAdapter({
      chain: this.chain.id as ChainId,
      api,
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

    const { address, amount, to, token: tokenName } = params;

    const token = this.getToken<ExpandToken>(tokenName);

    if (!token) {
      throw new TokenNotFound(token);
    }

    const toChain = chains[to];
    const accountId = this.api?.createType("AccountId32", address).toHex();
    const dst = {
      parents: 1,
      interior:
        to === "kusama" || to === "polkadot"
          ? { X1: { AccountId32: { id: accountId, network: "Any" } } }
          : {
              X2: [
                { Parachain: toChain.paraChainId },
                { AccountId32: { id: accountId, network: "Any" } },
              ],
            },
    };

    return this.api?.tx.xTokens.transfer(
      token.toChainData(),
      amount.toChainData(),
      { V1: dst },
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.getDestWeight(tokenName, to)!.toString()
    );
  }
}

export class BasiliskAdapter extends BaseHydradxAdapter {
  constructor() {
    super(chains.basilisk, basiliskRoutersConfig, basiliskTokensConfig);
  }
}

export class HydraAdapter extends BaseHydradxAdapter {
  constructor() {
    super(chains.hydradx, hydraRoutersConfig, hydraTokensConfig);
  }
}
