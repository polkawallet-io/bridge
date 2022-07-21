import { Storage } from '@acala-network/sdk/utils/storage';
import { AnyApi, FixedPointNumber as FN, Token } from '@acala-network/sdk-core';
import { combineLatest, map, Observable, of } from 'rxjs';

import { DeriveBalancesAll } from '@polkadot/api-derive/balances/types';

import { BaseCrossChainAdapter } from '../base-chain-adapter';
import { chains, ChainName } from '../configs';
import { xcmFeeConfig } from '../configs/xcm-fee';
import { CurrencyNotFound, TokenConfigNotFound } from '../errors';
import { BalanceAdapter, BalanceData, BridgeTxParams, Chain, CrossChainRouter, CrossChainTransferParams } from '../types';

const supported_tokens: Record<string, number> = {
  KMA: 1,
  KUSD: 9,
  LKSM: 10,
  KSM: 12,
  KAR: 8
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
    assets: (id: number, address: string) =>
      Storage.create<any>({
        api,
        path: 'query.assets.account',
        params: [id, address]
      })
  };
};

interface MantaBalanceAdapterConfigs {
  chain: ChainName;
  api: AnyApi;
}

class MantaBalanceAdapter implements BalanceAdapter {
  private storages: ReturnType<typeof createBalanceStorages>;
  readonly chain: ChainName;
  readonly decimals: number;
  readonly ed: FN;
  readonly nativeToken: string;

  constructor ({ api, chain }: MantaBalanceAdapterConfigs) {
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

    const tokenID = supported_tokens[token];

    if (!tokenID) {
      throw new CurrencyNotFound(token);
    }

    return this.storages.assets(tokenID, address).observable.pipe(
      map((balance) => {
        const amount = FN.fromInner(balance.unwrapOrDefault()?.balance?.toString() || '0', this.getTokenDecimals(token));

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

    if (!xcmFeeConfig[this.chain][token as string]) {
      throw new TokenConfigNotFound(token as string, this.chain);
    }

    return of(FN.fromInner(xcmFeeConfig[this.chain][token as string].existentialDeposit, this.getTokenDecimals(token as string)));
  }

  public getTokenDecimals (token: string): number {
    if (!xcmFeeConfig[this.chain][token]) {
      throw new TokenConfigNotFound(token, this.chain);
    }

    return xcmFeeConfig[this.chain][token].decimals;
  }
}

class BaseMantaAdapter extends BaseCrossChainAdapter {
  private balanceAdapter?: MantaBalanceAdapter;
  constructor (chain: Chain, routers: Omit<CrossChainRouter, 'from'>[]) {
    super(chain, routers);
  }

  public override async setApi (api: AnyApi) {
    this.api = api;

    await api.isReady;

    this.balanceAdapter = new MantaBalanceAdapter({ chain: this.chain.id, api });
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

    if (!tokenId) {
      throw new CurrencyNotFound(token);
    }

    return {
      module: 'xTokens',
      call: 'transfer',
      params: [
        { MantaCurrency: tokenId },
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

export class CalamariAdapter extends BaseMantaAdapter {
  constructor () {
    super(chains.calamari, [
      { to: chains.karura, token: 'KMA' },
      { to: chains.karura, token: 'KUSD' },
      { to: chains.karura, token: 'LKSM' },
      { to: chains.karura, token: 'KSM' },
      { to: chains.karura, token: 'KAR' }
    ]);
  }
}
