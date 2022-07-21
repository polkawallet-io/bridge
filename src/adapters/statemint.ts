import { Storage } from '@acala-network/sdk/utils/storage';
import { AnyApi, FixedPointNumber as FN, Token } from '@acala-network/sdk-core';
import { combineLatest, map, Observable, of } from 'rxjs';

import { DeriveBalancesAll } from '@polkadot/api-derive/balances/types';
import { BN } from '@polkadot/util';

import { BaseCrossChainAdapter } from '../base-chain-adapter';
import { chains, RegisteredChainName } from '../configs';
import { CurrencyNotFound } from '../errors';
import { BalanceAdapter, BalanceData, BridgeTxParams, Chain, CrossChainRouter, CrossChainTransferParams } from '../types';

const supported_assets: Record<string, BN> = {
  RMRK: new BN(8),
  ARIS: new BN(16),
  USDT: new BN(1984)
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
    assets: (assetId: BN, address: string) =>
      Storage.create<any>({
        api,
        path: 'query.assets.account',
        params: [assetId, address]
      }),
    assetsMeta: (assetId: BN) =>
      Storage.create<any>({
        api,
        path: 'query.assets.metadata',
        params: [assetId]
      }),
    assetsInfo: (assetId: BN) =>
      Storage.create<any>({
        api,
        path: 'query.assets.asset',
        params: [assetId]
      })
  };
};

interface StatemintBalanceAdapterConfigs {
  api: AnyApi;
}

class StatemintBalanceAdapter implements BalanceAdapter {
  private storages: ReturnType<typeof createBalanceStorages>;
  readonly decimals: number;
  readonly ed: FN;
  readonly nativeToken: string;

  constructor ({ api }: StatemintBalanceAdapterConfigs) {
    this.storages = createBalanceStorages(api);
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

    const assetId = supported_assets[token];

    if (!assetId) {
      throw new CurrencyNotFound(token);
    }

    return combineLatest({
      meta: this.storages.assetsMeta(assetId).observable,
      balance: this.storages.assets(assetId, address).observable
    }).pipe(
      map(({ balance, meta }) => {
        const amount = FN.fromInner(balance.unwrapOrDefault()?.balance?.toString() || '0', meta.decimals?.toNumber());

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

    const assetId = supported_assets[token as string];

    if (!assetId) {
      throw new CurrencyNotFound(token as string);
    }

    return combineLatest({
      info: this.storages.assetsInfo(assetId).observable,
      meta: this.storages.assetsMeta(assetId).observable
    }).pipe(map(({ info, meta }) => FN.fromInner(info.minBalance?.toString() || '0', meta.decimals?.toNumber())));
  }
}

class BaseStatemintAdapter extends BaseCrossChainAdapter {
  private balanceAdapter?: StatemintBalanceAdapter;
  constructor (chain: Chain, routers: Omit<CrossChainRouter, 'from'>[]) {
    super(chain, routers);
  }

  public override async setApi (api: AnyApi) {
    this.api = api;

    await api.isReady;

    this.balanceAdapter = new StatemintBalanceAdapter({ api });
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

    // to relay chain
    if (to === 'kusama' || to === 'polkadot') {
      if (token !== this.balanceAdapter?.nativeToken) {
        throw new CurrencyNotFound(token);
      }

      const dst = { interior: 'Here', parents: 1 };
      const acc = { interior: { X1: { AccountId32: { id: accountId, network: 'Any' } } }, parents: 0 };
      const ass = [
        {
          fun: { Fungible: amount.toChainData() },
          id: { Concrete: { interior: 'Here', parents: 1 } }
        }
      ];
      const callParams = [{ V1: dst }, { V1: acc }, { V1: ass }, 0, 'Unlimited'];

      return {
        module: 'polkadotXcm',
        call: 'limitedTeleportAssets',
        params: callParams
      };
    }

    // to karura/acala
    const assetId = supported_assets[token];

    if ((to !== 'acala' && to !== 'karura') || token === this.balanceAdapter?.nativeToken || !assetId) {
      throw new CurrencyNotFound(token);
    }

    const dst = { X2: ['Parent', { Parachain: toChain.paraChainId }] };
    const acc = { X1: { AccountId32: { id: accountId, network: 'Any' } } };
    const ass = [
      {
        ConcreteFungible: {
          id: { X2: [{ PalletInstance: 50 }, { GeneralIndex: assetId }] },
          amount: amount.toChainData()
        }
      }
    ];
    const callParams = [{ V0: dst }, { V0: acc }, { V0: ass }, 0, 'Unlimited'];

    return {
      module: 'polkadotXcm',
      call: 'limitedReserveTransferAssets',
      params: callParams
    };
  }
}

export class StatemintAdapter extends BaseStatemintAdapter {
  constructor () {
    super(chains.statemint, [{ to: chains.polkadot, token: 'DOT' }]);
  }
}

export class StatemineAdapter extends BaseStatemintAdapter {
  constructor () {
    super(chains.statemine, [
      { to: chains.kusama, token: 'KSM' },
      { to: chains.karura, token: 'RMRK' },
      { to: chains.karura, token: 'ARIS' },
      { to: chains.karura, token: 'USDT' }
    ]);
  }
}
