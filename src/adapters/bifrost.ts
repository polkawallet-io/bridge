import { Storage } from '@acala-network/sdk/utils/storage';
import { AnyApi, FixedPointNumber as FN, Token } from '@acala-network/sdk-core';
import { combineLatest, map, Observable, of } from 'rxjs';

import { DeriveBalancesAll } from '@polkadot/api-derive/balances/types';

import { BaseCrossChainAdapter } from '../base-chain-adapter';
import { chains, RegisteredChainName } from '../configs';
import { xcmFeeConfig } from '../configs/xcm-fee';
import { CurrencyNotFound } from '../errors';
import { BalanceAdapter, BalanceData, BridgeTxParams, Chain, CrossChainRouter, CrossChainTransferParams } from '../types';

const supported_tokens: Record<string, Object> = {
  KUSD: { Stable: 'KUSD' },
  AUSD: { Stable: 'AUSD' },
  BNC: { Native: 'BNC' },
  VSKSM: { VSToken: 'KSM' },
  KSM: { Token: 'KSM' },
  KAR: { Token: 'KAR' }
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const createBalanceStorages = (api: AnyApi) => {
  return {
    balances: (address: string) =>
      Storage.create<DeriveBalancesAll>({
        api,
        path: 'derive.balances.all',
        params: [address]
      }),
    assets: (address: string, token: Object) =>
      Storage.create<any>({
        api,
        path: 'query.tokens.accounts',
        params: [address, token]
      })
  };
};

interface BifrostBalanceAdapterConfigs {
  chain: RegisteredChainName;
  api: AnyApi;
}

class BifrostBalanceAdapter implements BalanceAdapter {
  private storages: ReturnType<typeof createBalanceStorages>;
  readonly chain: RegisteredChainName;
  readonly decimals: number;
  readonly ed: FN;
  readonly nativeToken: string;

  constructor ({ api, chain }: BifrostBalanceAdapterConfigs) {
    this.storages = createBalanceStorages(api);
    this.chain = chain;
    this.decimals = api.registry.chainDecimals[0];
    this.ed = FN.fromInner(api.consts.balances.existentialDeposit.toString(), this.decimals);
    this.nativeToken = api.registry.chainTokens[0];
  }

  public subscribeBalance (token: string, address: string): Observable<BalanceData> {
    const storage = this.storages.balances(address);

    if (token === this.nativeToken) {
      return storage.observable.pipe(
        map((data) => ({
          free: FN.fromInner(data.freeBalance.toString(), this.decimals),
          locked: FN.fromInner(data.lockedBalance.toString(), this.decimals),
          reserved: FN.fromInner(data.reservedBalance.toString(), this.decimals),
          available: FN.fromInner(data.availableBalance.toString(), this.decimals)
        }))
      );
    }

    const tokenId = supported_tokens[token];

    if (!tokenId) {
      throw new CurrencyNotFound(token);
    }

    return this.storages.assets(address, tokenId).observable.pipe(
      map((balance) => {
        const amount = FN.fromInner(balance.free?.toString() || '0', this.getTokenDecimals(token));

        return {
          free: amount,
          locked: new FN(0),
          reserved: new FN(0),
          available: amount
        };
      })
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getED (token?: string | Token): Observable<FN> {
    if (token === this.nativeToken) {
      return of(this.ed);
    }

    return of(FN.fromInner(xcmFeeConfig[this.chain][token as string].existentialDeposit, this.getTokenDecimals(token as string)));
  }

  public getTokenDecimals (token: string): number {
    return xcmFeeConfig[this.chain][token]?.decimals || this.decimals;
  }
}

class BaseBifrostAdapter extends BaseCrossChainAdapter {
  private balanceAdapter?: BifrostBalanceAdapter;
  constructor (chain: Chain, routers: Omit<CrossChainRouter, 'from'>[]) {
    super(chain, routers);
  }

  public override async setApi (api: AnyApi) {
    this.api = api;

    await api.isReady;

    this.balanceAdapter = new BifrostBalanceAdapter({ chain: this.chain.id, api });
  }

  public subscribeTokenBalance (token: string, address: string): Observable<BalanceData> {
    if (!this.balanceAdapter) {
      return new Observable((sub) =>
        sub.next({
          free: FN.ZERO,
          locked: FN.ZERO,
          available: FN.ZERO,
          reserved: FN.ZERO
        })
      );
    }

    return this.balanceAdapter.subscribeBalance(token, address);
  }

  public subscribeMaxInput (token: string, address: string, to: RegisteredChainName): Observable<FN> {
    if (!this.balanceAdapter) {
      return new Observable((sub) => sub.next(FN.ZERO));
    }

    return combineLatest({
      txFee:
        token === this.balanceAdapter?.nativeToken
          ? this.estimateTxFee(
            {
              amount: FN.ZERO,
              to,
              token,
              address
            },
            address
          )
          : '0',
      balance: this.balanceAdapter.subscribeBalance(token, address).pipe(map((i) => i.available)),
      ed: this.balanceAdapter?.getED(token)
    }).pipe(
      map(({ balance, ed, txFee }) => {
        const feeFactor = 1.2;
        const fee = FN.fromInner(txFee, this.balanceAdapter!.decimals).mul(new FN(feeFactor));

        // always minus ed
        return balance.minus(fee).minus(ed || FN.ZERO);
      })
    );
  }

  public getBridgeTxParams (params: CrossChainTransferParams): BridgeTxParams {
    const { address, amount, to, token } = params;
    const toChain = chains[to];

    const accountId = this.api?.createType('AccountId32', address).toHex();

    const tokenId = supported_tokens[token];

    if (!tokenId) {
      throw new CurrencyNotFound(token);
    }

    return {
      module: 'xTokens',
      call: 'transfer',
      params: [
        tokenId,
        amount.toChainData(),
        {
          V1: {
            parents: 1,
            interior: { X2: [{ Parachain: toChain.paraChainId }, { AccountId32: { id: accountId, network: 'Any' } }] }
          }
        },
        5_000_000_000
      ]
    };
  }
}

export class BifrostAdapter extends BaseBifrostAdapter {
  constructor () {
    super(chains.bifrost, [
      { to: chains.karura, token: 'BNC' },
      { to: chains.karura, token: 'KUSD' },
      { to: chains.karura, token: 'VSKSM' },
      { to: chains.karura, token: 'KSM' },
      { to: chains.karura, token: 'KAR' }
    ]);
  }
}
