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

export const uniqueRoutersConfig: Omit<RouteConfigs, "from">[] = [
  {
    to: "acala",
    token: "UNQ",
    xcm: {
      fee: { token: "UNQ", amount: "101030000000000000" },
      weightLimit: "Unlimited",
    },
  },
];

export const uniqueTokensConfig: Record<string, BasicToken> = {
  UNQ: { name: "UNQ", symbol: "UNQ", decimals: 18, ed: "0" },
};

export const quartzRoutersConfig: Omit<RouteConfigs, "from">[] = [
  {
    to: "karura",
    token: "QTZ",
    xcm: {
      fee: { token: "QTZ", amount: "64000000000000000" },
      weightLimit: "Unlimited",
    },
  },
];

export const quartzTokensConfig: Record<string, BasicToken> = {
  QTZ: { name: "QTZ", symbol: "QTZ", decimals: 18, ed: "1000000000000000000" },
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

class UniqueBalanceAdapter extends BalanceAdapter {
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

class BaseUniqueAdapter extends BaseCrossChainAdapter {
  private balanceAdapter?: UniqueBalanceAdapter;

  public async init(api: AnyApi) {
    this.api = api;

    await api.isReady;

    this.balanceAdapter = new UniqueBalanceAdapter({
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

    const { address, amount, to, token } = params;
    const toChain = chains[to];

    if (token !== this.balanceAdapter?.nativeToken) {
      throw new TokenNotFound(token);
    }

    const accountId = this.api?.createType("AccountId32", address).toHex();

    const dst = { X2: ["Parent", { ParaChain: toChain.paraChainId }] };
    const acc = { X1: { AccountId32: { id: accountId, network: "Any" } } };
    const ass = [{ ConcreteFungible: { amount: amount.toChainData() } }];

    return this.api?.tx.polkadotXcm.limitedReserveTransferAssets(
      { V0: dst },
      { V0: acc },
      { V0: ass },
      0,
      this.getDestWeight(token, to)?.toString()
    );
  }
}

export class QuartzAdapter extends BaseUniqueAdapter {
  constructor() {
    super(chains.quartz, quartzRoutersConfig, quartzTokensConfig);
  }
}

export class UniqueAdapter extends BaseUniqueAdapter {
  constructor() {
    super(chains.unique, uniqueRoutersConfig, uniqueTokensConfig);
  }
}
