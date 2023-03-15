import {
  AnyApi,
  FixedPointNumber,
  FixedPointNumber as FN,
} from "@acala-network/sdk-core";
import {
  firstValueFrom,
  combineLatest,
  from,
  Observable,
  of,
  timeout,
  TimeoutError,
} from "rxjs";
import { catchError, map } from "rxjs/operators";

import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";

import { ChainId, chains } from "./configs";
import { AdapterNotFound, RouterConfigNotFound, TokenNotFound } from "./errors";
import {
  BalanceChangeStatue,
  BalanceData,
  BasicToken,
  Chain,
  BalanceChangeConfig,
  InputConfig,
  RouteConfigs,
  TransferParams,
  TokenBalance,
} from "./types";

const DEFAULT_TX_CHECKING_TIMEOUT = 2 * 60 * 1000;

export abstract class BaseCrossChainAdapter {
  protected routers: Omit<RouteConfigs, "from">[];
  protected tokens: Record<string, BasicToken>;
  protected api?: AnyApi;
  readonly chain: Chain;
  // @ts-ignore
  private findAdapter!: (chain: Chain | ChainId) => BaseCrossChainAdapter;

  constructor(
    chain: Chain,
    routers: Omit<RouteConfigs, "from">[],
    tokens: Record<string, BasicToken>
  ) {
    this.chain = chain;
    this.routers = routers;
    this.tokens = tokens;
  }

  public abstract init(api: AnyApi, ...others: any[]): Promise<void>;

  public injectFindAdapter(
    func: (chain: ChainId | Chain) => BaseCrossChainAdapter
  ): void {
    this.findAdapter = func;
  }

  public getRouters(): RouteConfigs[] {
    return this.routers.map((i) => ({
      ...i,
      from: this.chain.id as ChainId,
    }));
  }

  public getSS58Prefix(): number {
    return Number(this.api?.registry.chainSS58?.toString());
  }

  public subscribeInputConfig(
    params: Omit<TransferParams, "amount">
  ): Observable<InputConfig> {
    const { signer, to, token } = params;

    const destFee = this.getCrossChainFee(token, to);

    // subscribe destination min receive
    const minInput$ = this.subscribeMinInput(token, to);
    const maxInput$ = this.subscribeMaxInput(token, signer, to);
    const estimateFee$ = this.estimateTxFee({
      ...params,
      amount: new FN("10000000000"),
    });

    return combineLatest({
      minInput: minInput$,
      maxInput: maxInput$,
      estimateFee: estimateFee$,
    }).pipe(
      map(({ estimateFee, maxInput, minInput }) => {
        return {
          minInput: minInput.max(FN.ZERO),
          maxInput: maxInput.max(FN.ZERO),
          ss58Prefix: chains[to].ss58Prefix,
          destFee,
          estimateFee,
        };
      })
    );
  }

  public getInputConfig(params: Omit<TransferParams, "amount">) {
    return firstValueFrom(this.subscribeInputConfig(params));
  }

  public subscribeMinInput(token: string, to: ChainId): Observable<FN> {
    const destFee = this.getCrossChainFee(token, to);

    return of(
      this.getDestED(token, to).balance.add(
        destFee.token === token ? destFee.balance : FN.ZERO
      )
    );
  }

  public getMinInput(token: string, to: ChainId) {
    return firstValueFrom(this.subscribeMinInput(token, to));
  }

  public getToken<R extends BasicToken = BasicToken>(
    token: string,
    chain?: ChainId
  ): R {
    let tokenConfig: BasicToken;

    if (!chain) return this.tokens[token] as R;

    if (chain === this.chain.id) {
      tokenConfig = this.tokens[token];
    } else {
      const destAdapter = this.findAdapter(chain);

      if (!destAdapter) {
        throw new AdapterNotFound(token);
      }

      tokenConfig = destAdapter.tokens[token];
    }

    if (!tokenConfig) throw new TokenNotFound(token, chain);

    return tokenConfig as R;
  }

  public getDestED(token: string, destChain: ChainId): TokenBalance {
    const tokenConfig = this.getToken(token, destChain);

    return {
      token,
      balance: FN.fromInner(tokenConfig.ed, tokenConfig.decimals),
    };
  }

  public getCrossChainFee(token: string, destChain: ChainId): TokenBalance {
    const router = this.routers.find(
      (e) => e.to === destChain && e.token === token
    );

    if (!router) {
      throw new RouterConfigNotFound(token, destChain, this.chain.id);
    }

    const feeToken = router.xcm?.fee?.token || token;

    return {
      token: feeToken,
      balance: FN.fromInner(
        router.xcm?.fee?.amount || 0,
        this.getToken(feeToken, destChain).decimals
      ),
    };
  }

  public getDestWeight(
    token: string,
    destChain: ChainId
  ): string | "Unlimited" | "Limited" | undefined {
    const router = this.routers.find(
      (e) => e.to === destChain && e.token === token
    );

    if (!router) {
      throw new RouterConfigNotFound(token, destChain, this.chain.id);
    }

    return router.xcm?.weightLimit;
  }

  public estimateTxFee(params: TransferParams) {
    let tx = this.createTx({
      ...params,
      // overwrite amount just for estimating fee
      amount: FixedPointNumber.fromInner("1"),
    });

    if (this.api?.type === "rxjs") {
      tx = tx as SubmittableExtrinsic<"rxjs", ISubmittableResult>;

      return tx.paymentInfo(params.signer).pipe(
        map((feeData) => {
          return feeData.partialFee.toString();
        }),
        catchError((e) => {
          console.debug(`fetch payment info failed, ${e}`);

          return "0";
        })
      );
    }

    // for promise api
    tx = tx as SubmittableExtrinsic<"promise", ISubmittableResult>;

    return from(
      (async () => {
        const feeData = await tx.paymentInfo(params.signer);

        return feeData.partialFee.toString();
      })()
    );
  }

  public getEstimateTxFee(params: TransferParams) {
    return firstValueFrom(this.estimateTxFee(params));
  }

  public subscribeBalanceChange(
    configs: BalanceChangeConfig
  ): Observable<BalanceChangeStatue> {
    const { address, amount, token, tolerance } = configs;
    // allow 1% tolerance as default
    const target = amount.mul(new FN(1 - (tolerance || 0.01)));

    let savedBalance: FN | undefined;

    return this.subscribeTokenBalance(token, address).pipe(
      timeout(configs.timeout || DEFAULT_TX_CHECKING_TIMEOUT),
      map((balance) => {
        if (!savedBalance) {
          savedBalance = balance.available;
        }

        const diff = balance.available.minus(savedBalance);

        if (savedBalance && diff.gte(target)) {
          return BalanceChangeStatue.SUCCESS;
        }

        return BalanceChangeStatue.CHECKING;
      }),
      catchError((e: Error) => {
        if (e instanceof TimeoutError) {
          return of(BalanceChangeStatue.TIMEOUT);
        }

        return of(BalanceChangeStatue.UNKNOWN_ERROR);
      })
    );
  }

  public watchBalanceChange(
    config: BalanceChangeConfig,
    callback: (error?: Error, status?: BalanceChangeStatue) => void
  ) {
    const subscriber = this.subscribeBalanceChange(config).subscribe({
      next: (status) => callback(undefined, status),
      error: (e) => callback(e, undefined),
    });

    return subscriber.unsubscribe;
  }

  public abstract subscribeTokenBalance(
    token: string,
    address: string
  ): Observable<BalanceData>;

  public getTokenBalance(token: string, address: string): Promise<BalanceData> {
    return firstValueFrom(this.subscribeTokenBalance(token, address));
  }

  public abstract subscribeMaxInput(
    token: string,
    address: string,
    to: ChainId
  ): Observable<FN>;

  public getMaxInput(token: string, address: string, to: ChainId): Promise<FN> {
    return firstValueFrom(this.subscribeMaxInput(token, address, to));
  }

  public abstract createTx(
    params: TransferParams
  ):
    | SubmittableExtrinsic<"promise", ISubmittableResult>
    | SubmittableExtrinsic<"rxjs", ISubmittableResult>;
}
