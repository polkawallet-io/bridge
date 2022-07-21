import { Storage } from '@acala-network/sdk/utils/storage';
import { AnyApi, FixedPointNumber as FN, Token } from '@acala-network/sdk-core';
import { combineLatest, map, Observable, of } from 'rxjs';

import { DeriveBalancesAll } from '@polkadot/api-derive/balances/types';

import { BaseCrossChainAdapter } from '../base-chain-adapter';
import { chains, ChainName } from '../configs';
import { xcmFeeConfig } from '../configs/xcm-fee';
import { CurrencyNotFound } from '../errors';
import { BalanceAdapter, BalanceData, BridgeTxParams, Chain, CrossChainRouter, CrossChainTransferParams } from '../types';

const supported_tokens: Record<string, string> = {
  KUSD: 'KUSD'
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
    assets: (address: string, token: string) =>
      Storage.create<any>({
        api,
        path: 'query.ormlTokens.accounts',
        params: [address, token]
      })
  };
};

interface CentrifugeBalanceAdapterConfigs {
  chain: ChainName;
  api: AnyApi;
}

class CentrifugeBalanceAdapter implements BalanceAdapter {
  private storages: ReturnType<typeof createBalanceStorages>;
  readonly chain: ChainName;
  readonly decimals: number;
  readonly ed: FN;
  readonly nativeToken: string;

  constructor ({ api, chain }: CentrifugeBalanceAdapterConfigs) {
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
        const amount = FN.fromInner(balance.free?.toString() || '0', this.getTokenDecimals(tokenId));

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

class BaseCentrifugeAdapter extends BaseCrossChainAdapter {
  private balanceAdapter?: CentrifugeBalanceAdapter;
  constructor (chain: Chain, routers: Omit<CrossChainRouter, 'from'>[]) {
    super(chain, routers);
  }

  public override async setApi (api: AnyApi) {
    this.api = api;

    await api.isReady;

    this.balanceAdapter = new CentrifugeBalanceAdapter({ chain: this.chain.id, api });
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

  public subscribeMaxInput (token: string, address: string, to: ChainName): Observable<FN> {
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

    if (!tokenId && token !== this.balanceAdapter?.nativeToken) {
      throw new CurrencyNotFound(token);
    }

    return {
      module: 'xTokens',
      call: 'transfer',
      params: [
        token === this.balanceAdapter?.nativeToken ? 'Native' : tokenId,
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

export class AltairAdapter extends BaseCentrifugeAdapter {
  constructor () {
    super(chains.altair, [
      { to: chains.karura, token: 'AIR' },
      { to: chains.karura, token: 'KUSD' }
    ]);
  }
}
