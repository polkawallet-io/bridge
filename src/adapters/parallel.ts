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
import { createRouteConfigs, validateAddress } from "../utils";

const DEST_WEIGHT = "Unlimited";

export const parallelRouteConfigs = createRouteConfigs("parallel", [
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
    token: "LDOT",
    xcm: {
      fee: { token: "LDOT", amount: "24037893" },
      weightLimit: DEST_WEIGHT,
    },
  },
]);

export const heikoRouteConfigs = createRouteConfigs("heiko", [
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
    token: "LKSM",
    xcm: {
      fee: { token: "LKSM", amount: "589618748" },
      weightLimit: DEST_WEIGHT,
    },
  },
]);

export const parallelTokensConfig: Record<
  string,
  Record<string, ExtendedToken>
> = {
  parallel: {
    PARA: {
      name: "PARA",
      symbol: "PARA",
      decimals: 12,
      ed: "100000000000",
      toRaw: () => "1",
    },
    ACA: {
      name: "ACA",
      symbol: "ACA",
      decimals: 12,
      ed: "100000000000",
      toRaw: () => "108",
    },
    AUSD: {
      name: "AUSD",
      symbol: "AUSD",
      decimals: 12,
      ed: "100000000000",
      toRaw: () => "104",
    },
    LDOT: {
      name: "LDOT",
      symbol: "LDOT",
      decimals: 10,
      ed: "500000000",
      toRaw: () => "110",
    },
  },
  heiko: {
    HKO: {
      name: "HKO",
      symbol: "HKO",
      decimals: 12,
      ed: "100000000000",
      toRaw: () => "0",
    },
    KAR: {
      name: "KAR",
      symbol: "KAR",
      decimals: 12,
      ed: "0",
      toRaw: () => "107",
    },
    KUSD: {
      name: "KUSD",
      symbol: "KUSD",
      decimals: 12,
      ed: "0",
      toRaw: () => "103",
    },
    LKSM: {
      name: "LKSM",
      symbol: "LKSM",
      decimals: 12,
      ed: "0",
      toRaw: () => "109",
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

    const tokenData: ExtendedToken = this.getToken(token);

    if (!tokenData) throw new TokenNotFound(token);

    return this.storages.assets(tokenData.toRaw(), address).observable.pipe(
      map((balance) => {
        const amount = FN.fromInner(
          balance.unwrapOrDefault()?.balance?.toString() || "0",
          tokenData.decimals
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

  public async init(api: AnyApi) {
    this.api = api;

    await api.isReady;

    const chain = this.chain.id as ChainId;

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
    return this.createXTokensTx(params);
  }
}

export class HeikoAdapter extends BaseParallelAdapter {
  constructor() {
    super(chains.heiko, heikoRouteConfigs, parallelTokensConfig.heiko);
  }
}

export class ParallelAdapter extends BaseParallelAdapter {
  constructor() {
    super(chains.parallel, parallelRouteConfigs, parallelTokensConfig.parallel);
  }
}
