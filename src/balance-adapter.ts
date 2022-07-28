import { AnyApi } from '@acala-network/sdk-core';
import { of } from 'rxjs';

import { Observable } from '@polkadot/types/types';
import { BN, BN_ZERO } from '@polkadot/util';

import { multiChainTokensConfig } from './configs/tokens';
import { ChainName } from './configs';
import { TokenConfigItemNotFound, TokenConfigNotFound } from './errors';
import { BalanceData, FN } from './types';

export interface BalanceAdapterConfigs {
  chain: ChainName;
  api: AnyApi;
}

export abstract class BalanceAdapter {
  readonly chain: ChainName;
  readonly decimals: number;
  readonly ed: FN;
  readonly nativeToken: string;

  constructor ({ api, chain }: BalanceAdapterConfigs) {
    this.chain = chain;
    this.decimals = api.registry.chainDecimals[0];
    this.ed = FN.fromInner(api.consts.balances?.existentialDeposit?.toString() || '0', this.decimals);
    this.nativeToken = api.registry.chainTokens[0];
  }

  public getTokenED (token?: string): Observable<FN> {
    if (!token || token === this.nativeToken) {
      return of(this.ed);
    }

    const decimals = this.getTokenDecimals(token);

    const tokenConfig = multiChainTokensConfig[token];

    if (!tokenConfig) {
      throw new TokenConfigNotFound(token);
    }

    if (tokenConfig.ed instanceof BN) {
      return of(FN.fromInner(tokenConfig.ed.toString(), decimals));
    }

    if (tokenConfig.ed[this.chain] === undefined) {
      throw new TokenConfigItemNotFound(token, 'ed', this.chain);
    }

    return of(FN.fromInner((tokenConfig.ed[this.chain] || BN_ZERO).toString(), decimals));
  }

  public getTokenDecimals (token?: string): number {
    if (!token || token === this.nativeToken) {
      return this.decimals;
    }

    const tokenConfig = multiChainTokensConfig[token];

    if (!tokenConfig) {
      throw new TokenConfigNotFound(token);
    }

    if (typeof tokenConfig.decimals === 'number') {
      return tokenConfig.decimals;
    }

    if (tokenConfig.decimals[this.chain] === undefined) {
      throw new TokenConfigItemNotFound(token, 'decimals', this.chain);
    }

    return tokenConfig.decimals[this.chain] || 18;
  }

  public abstract subscribeBalance(token: string, address: string): Observable<BalanceData>;
}
