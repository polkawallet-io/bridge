import {
  AnyApi,
  FixedPointNumber,
  FixedPointNumber as FN,
} from "@acala-network/sdk-core";
import {
  combineLatest,
  firstValueFrom,
  from,
  Observable,
  of,
  timeout,
  TimeoutError,
} from "rxjs";
import { catchError, map } from "rxjs/operators";

import { ApiRx } from "@polkadot/api";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";

import { ChainName, chains } from "./configs";
import {
  AdapterNotFound,
  RouterConfigNotFound,
  TokenConfigNotFound,
} from "./errors";
import {
  BalanceChangedStatus,
  BalanceData,
  BasicToken,
  Chain,
  CrossChainBalanceChangedConfigs,
  CrossChainInputConfigs,
  CrossChainRouterConfigs,
  CrossChainTransferParams,
  TokenBalance,
} from "./types";

const DEFAULT_TX_CHECKING_TIMEOUT = 2 * 60 * 1000;

export abstract class BaseCrossChainAdapter {
  protected routers: Omit<CrossChainRouterConfigs, "from">[];
  protected tokens: Record<string, BasicToken>;
  protected api?: AnyApi;
  readonly chain: Chain;
  // @ts-ignore
  private findAdapter!: (chain: Chain | ChainName) => BaseCrossChainAdapter;

  constructor(
    chain: Chain,
    routers: Omit<CrossChainRouterConfigs, "from">[],
    tokens: Record<string, BasicToken>
  ) {
    this.chain = chain;
    this.routers = routers;
    this.tokens = tokens;
  }

  public async setApi(api: AnyApi) {
    this.api = api;

    if (this.api?.type === "rxjs") {
      await firstValueFrom(api.isReady as Observable<ApiRx>);
    }

    await api.isReady;
  }

  public injectFindAdapter(
    func: (chain: ChainName | Chain) => BaseCrossChainAdapter
  ): void {
    this.findAdapter = func;
  }

  public getRouters(): CrossChainRouterConfigs[] {
    return this.routers.map((i) => ({
      ...i,
      from: this.chain.id as ChainName,
    }));
  }

  public getSS58Prefix(): number {
    return Number(this.api?.registry.chainSS58?.toString());
  }

  public subscribeInputConfigs(
    params: Omit<CrossChainTransferParams, "amount">
  ): Observable<CrossChainInputConfigs> {
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

  public subscribeMinInput(token: string, to: ChainName): Observable<FN> {
    const destFee = this.getCrossChainFee(token, to);

    return of(
      this.getDestED(token, to).balance.add(
        destFee.token === token ? destFee.balance : FN.ZERO
      )
    );
  }

  public getToken(token: string, chain: ChainName): BasicToken {
    let tokenConfig: BasicToken;

    if (chain === this.chain.id) {
      tokenConfig = this.tokens[token];
    } else {
      const destAdapter = this.findAdapter(chain);

      if (!destAdapter) {
        throw new AdapterNotFound(token);
      }

      tokenConfig = destAdapter.tokens[token];
    }

    if (!tokenConfig) {
      throw new TokenConfigNotFound(token, chain);
    }

    return tokenConfig;
  }

  public getDestED(token: string, destChain: ChainName): TokenBalance {
    const tokenConfig = this.getToken(token, destChain);

    return {
      token,
      balance: FN.fromInner(tokenConfig.ed, tokenConfig.decimals),
    };
  }

  public getCrossChainFee(token: string, destChain: ChainName): TokenBalance {
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
    destChain: ChainName
  ): string | "Unlimited" | "Limited" | undefined {
    const router = this.routers.find(
      (e) => e.to === destChain && e.token === token
    );

    if (!router) {
      throw new RouterConfigNotFound(token, destChain, this.chain.id);
    }

    return router.xcm?.weightLimit;
  }

  public estimateTxFee(params: CrossChainTransferParams) {
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

  public subscribeBalanceChanged(
    configs: CrossChainBalanceChangedConfigs
  ): Observable<BalanceChangedStatus> {
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
          return BalanceChangedStatus.SUCCESS;
        }

        return BalanceChangedStatus.CHECKING;
      }),
      catchError((e: Error) => {
        if (e instanceof TimeoutError) {
          return of(BalanceChangedStatus.TIMEOUT);
        }

        return of(BalanceChangedStatus.UNKNOWN_ERROR);
      })
    );
  }

  public abstract subscribeTokenBalance(
    token: string,
    address: string
  ): Observable<BalanceData>;

  public abstract subscribeMaxInput(
    token: string,
    address: string,
    to: ChainName
  ): Observable<FN>;

  public abstract createTx(
    params: CrossChainTransferParams
  ):
    | SubmittableExtrinsic<"promise", ISubmittableResult>
    | SubmittableExtrinsic<"rxjs", ISubmittableResult>;
}
