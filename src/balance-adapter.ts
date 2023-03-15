import { AnyApi } from "@acala-network/sdk-core";

import { Observable } from "@polkadot/types/types";

import { ChainId } from "./configs";
import { TokenNotFound } from "./errors";
import { BalanceData, BasicToken, FN } from "./types";

export interface BalanceAdapterConfigs {
  chain: ChainId;
  api: AnyApi;
  tokens: Record<string, BasicToken>;
}

export abstract class BalanceAdapter {
  readonly chain: ChainId;
  readonly decimals: number;
  readonly ed: FN;
  readonly nativeToken: string;
  readonly tokens: Record<string, BasicToken>;

  constructor({ api, chain, tokens }: BalanceAdapterConfigs) {
    this.chain = chain;
    this.decimals = api.registry.chainDecimals[0];
    this.ed = FN.fromInner(
      api.consts.balances?.existentialDeposit?.toString() || "0",
      this.decimals
    );
    this.nativeToken = api.registry.chainTokens[0];
    this.tokens = tokens;
  }

  public getToken<R extends BasicToken = BasicToken>(token: string): R {
    const tokenConfig = this.tokens[token];

    if (!tokenConfig) throw new TokenNotFound(token, this.chain);

    return tokenConfig as R;
  }

  public abstract subscribeBalance(
    token: string,
    address: string
  ): Observable<BalanceData>;
}
