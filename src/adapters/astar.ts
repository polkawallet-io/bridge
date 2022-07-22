import { Storage } from '@acala-network/sdk/utils/storage';
import { AnyApi, FixedPointNumber as FN } from '@acala-network/sdk-core';
import { combineLatest, map, Observable } from 'rxjs';

import { SubmittableExtrinsic } from '@polkadot/api/types';
import { DeriveBalancesAll } from '@polkadot/api-derive/balances/types';
import { ISubmittableResult } from '@polkadot/types/types';

import { BalanceAdapter, BalanceAdapterConfigs } from '../balance-adapter';
import { BaseCrossChainAdapter } from '../base-chain-adapter';
import { ChainName, chains, routersConfig } from '../configs';
import { ApiNotFound, CurrencyNotFound } from '../errors';
import { BalanceData, CrossChainTransferParams } from '../types';

const SUPPORTED_TOKENS: Record<string, string> = {
  KUSD: '18446744073709551616'
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
    assets: (tokenId: string, address: string) =>
      Storage.create<any>({
        api,
        path: 'query.assets.account',
        params: [tokenId, address]
      })
  };
};

class AstarBalanceAdapter extends BalanceAdapter {
  private storages: ReturnType<typeof createBalanceStorages>;

  constructor ({ api, chain }: BalanceAdapterConfigs) {
    super({ api, chain });
    this.storages = createBalanceStorages(api);
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

    const tokenId = SUPPORTED_TOKENS[token];

    if (!tokenId) {
      throw new CurrencyNotFound(token);
    }

    return this.storages.assets(tokenId, address).observable.pipe(
      map((balance) => {
        const amount = FN.fromInner(balance.balance?.toString() || '0', this.getTokenDecimals(token));

        return {
          free: amount,
          locked: new FN(0),
          reserved: new FN(0),
          available: amount
        };
      })
    );
  }
}

class BaseAstarAdapter extends BaseCrossChainAdapter {
  private balanceAdapter?: AstarBalanceAdapter;

  public override async setApi (api: AnyApi) {
    this.api = api;

    await api.isReady;

    this.balanceAdapter = new AstarBalanceAdapter({ chain: this.chain.id, api });
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
              address,
              signer: address
            }
          )
          : '0',
      balance: this.balanceAdapter.subscribeBalance(token, address).pipe(map((i) => i.available)),
      ed: this.balanceAdapter?.getTokenED(token)
    }).pipe(
      map(({ balance, ed, txFee }) => {
        const feeFactor = 1.2;
        const fee = FN.fromInner(txFee, this.balanceAdapter?.getTokenDecimals(token)).mul(new FN(feeFactor));

        // always minus ed
        return balance.minus(fee).minus(ed || FN.ZERO);
      })
    );
  }

  public createTx (params: CrossChainTransferParams): SubmittableExtrinsic<'promise', ISubmittableResult> | SubmittableExtrinsic<'rxjs', ISubmittableResult> {
    if (this.api === undefined) {
      throw new ApiNotFound(this.chain.id);
    }

    const { address, amount, to, token } = params;
    const toChain = chains[to];

    const accountId = this.api?.createType('AccountId32', address).toHex();

    const dst = { parents: 1, interior: { X1: { Parachain: toChain.paraChainId } } };
    const acc = { parents: 0, interior: { X1: { AccountId32: { id: accountId, network: 'Any' } } } };
    let ass: any = [{ id: { Concrete: { parents: 0, interior: 'Here' } }, fun: { Fungible: amount.toChainData() } }];

    if (token === this.balanceAdapter?.nativeToken) {
      return this.api?.tx.polkadotXcm.reserveTransferAssets({ V1: dst }, { V1: acc }, { V1: ass }, 0);
    }

    const tokenIds: Record<string, string> = {
      KUSD: '0x0081'
    };

    const tokenId = tokenIds[token];

    if (!tokenId) {
      throw new CurrencyNotFound(token);
    }

    ass = [
      {
        id: {
          Concrete: {
            parents: 1,
            interior: { X2: [{ Parachain: toChain.paraChainId }, { GeneralKey: tokenId }] }
          }
        },
        fun: { Fungible: amount.toChainData() }
      }
    ];

    return this.api?.tx.polkadotXcm.reserveTransferAssets({ V1: dst }, { V1: acc }, { V1: ass }, 0);
  }
}

export class ShidenAdapter extends BaseAstarAdapter {
  constructor () {
    super(chains.shiden, routersConfig.shiden);
  }
}
