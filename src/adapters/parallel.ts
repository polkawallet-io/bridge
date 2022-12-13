import { Storage } from "@acala-network/sdk/utils/storage";
import { AnyApi, FixedPointNumber as FN } from "@acala-network/sdk-core";
import { combineLatest, map, Observable } from "rxjs";

import { SubmittableExtrinsic } from "@polkadot/api/types";
import { DeriveBalancesAll } from "@polkadot/api-derive/balances/types";
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

const DEST_WEIGHT = "5000000000";

export const parallelRoutersConfig: Omit<CrossChainRouterConfigs, "from">[] = [
  {
    to: "acala",
    token: "PARA",
    xcm: {
      fee: { token: "PARA", amount: "6400000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "acala",
    token: "ACA",
    xcm: {
      fee: { token: "ACA", amount: "6400000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "acala",
    token: "AUSD",
    xcm: {
      fee: { token: "AUSD", amount: "3721109059" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "acala",
    token: "LDOT",
    xcm: {
      fee: { token: "LDOT", amount: "24037893" },
      weightLimit: DEST_WEIGHT,
    },
  },
];

export const heikoRoutersConfig: Omit<CrossChainRouterConfigs, "from">[] = [
  {
    to: "karura",
    token: "HKO",
    xcm: {
      fee: { token: "HKO", amount: "6400000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "karura",
    token: "KAR",
    xcm: {
      fee: { token: "KAR", amount: "6400000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "karura",
    token: "KUSD",
    xcm: {
      fee: { token: "KUSD", amount: "8305746640" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "karura",
    token: "LKSM",
    xcm: {
      fee: { token: "LKSM", amount: "589618748" },
      weightLimit: DEST_WEIGHT,
    },
  },
];

export const parallelTokensConfig: Record<
  string,
  Record<string, BasicToken>
> = {
  parallel: {
    PARA: { name: "PARA", symbol: "PARA", decimals: 12, ed: "100000000000" },
    ACA: { name: "ACA", symbol: "ACA", decimals: 12, ed: "100000000000" },
    AUSD: { name: "AUSD", symbol: "AUSD", decimals: 12, ed: "100000000000" },
    LDOT: { name: "LDOT", symbol: "LDOT", decimals: 10, ed: "500000000" },
  },
  heiko: {
    HKO: { name: "HKO", symbol: "HKO", decimals: 12, ed: "100000000000" },
    KAR: { name: "KAR", symbol: "KAR", decimals: 12, ed: "0" },
    KUSD: { name: "KUSD", symbol: "KUSD", decimals: 12, ed: "0" },
    LKSM: { name: "LKSM", symbol: "LKSM", decimals: 12, ed: "0" },
  },
};

const SUPPORTED_TOKENS: Record<string, number> = {
  HKO: 0,
  KAR: 107,
  KUSD: 103,
  LKSM: 109,
  PARA: 1,
  ACA: 108,
  AUSD: 104,
  LDOT: 110,
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

class ParallelBalanceAdapter extends BalanceAdapter {
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
      throw new CurrencyNotFound(token);
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

class BaseParallelAdapter extends BaseCrossChainAdapter {
  private balanceAdapter?: ParallelBalanceAdapter;

  public override async setApi(api: AnyApi) {
    this.api = api;

    await api.isReady;

    const chain = this.chain.id as ChainName;

    this.balanceAdapter = new ParallelBalanceAdapter({
      chain,
      api,
      tokens: parallelTokensConfig[chain],
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

    const tokenId = SUPPORTED_TOKENS[token];

    if (tokenId === undefined) {
      throw new CurrencyNotFound(token);
    }

    return this.api.tx.xTokens.transfer(
      tokenId,
      amount.toChainData(),
      {
        V1: {
          parents: 1,
          interior: {
            X2: [
              { Parachain: toChain.paraChainId },
              { AccountId32: { id: accountId, network: "Any" } },
            ],
          },
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.getDestWeight(token, to)!.toString()
    );
  }
}

export class HeikoAdapter extends BaseParallelAdapter {
  constructor() {
    super(chains.heiko, heikoRoutersConfig, parallelTokensConfig.heiko);
  }
}

export class ParallelAdapter extends BaseParallelAdapter {
  constructor() {
    super(
      chains.parallel,
      parallelRoutersConfig,
      parallelTokensConfig.parallel
    );
  }
}
