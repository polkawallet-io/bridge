import { Wallet } from '@acala-network/sdk/wallet';
import { AnyApi, FixedPointNumber } from '@acala-network/sdk-core';
import { catchError, combineLatest, firstValueFrom, map, Observable, of } from 'rxjs';

import { ApiRx } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { ISubmittableResult } from '@polkadot/types/types';

import { BaseCrossChainAdapter } from '../base-chain-adapter';
import { ChainName, chains, routersConfig } from '../configs';
import { ApiNotFound } from '../errors';
import { BalanceData, CrossChainTransferParams } from '../types';
import { isChainEqual } from '../utils/is-chain-equal';

export class BaseAcalaAdapter extends BaseCrossChainAdapter {
  private wallet?: Wallet;

  public override async setApi (api: AnyApi) {
    this.api = api;

    if (this.api?.type === 'rxjs') {
      await firstValueFrom(api.isReady as Observable<ApiRx>);
    }

    await api.isReady;

    this.wallet = new Wallet(api);

    await this.wallet.isReady;
  }

  public override subscribeMinInput (token: string, to: ChainName): Observable<FixedPointNumber> {
    if (!this.wallet) {
      throw new ApiNotFound(this.chain.id);
    }

    const destFee = this.getCrossChainFee(token, to);

    return of(this.getDestED(token, to).balance.add(destFee.token === token ? destFee.balance : FixedPointNumber.ZERO));
  }

  public subscribeTokenBalance (token: string, address: string): Observable<BalanceData> {
    if (!this.wallet) {
      throw new ApiNotFound(this.chain.id);
    }

    const zeroResult: Observable<BalanceData> = new Observable((sub) =>
      sub.next({
        free: FixedPointNumber.ZERO,
        locked: FixedPointNumber.ZERO,
        available: FixedPointNumber.ZERO,
        reserved: FixedPointNumber.ZERO
      })
    );

    return this.wallet.subscribeBalance(token, address).pipe(catchError((_) => zeroResult));
  }

  public subscribeMaxInput (token: string, address: string, to: ChainName): Observable<FixedPointNumber> {
    if (!this.wallet) {
      throw new ApiNotFound(this.chain.id);
    }

    const tokens = this.wallet.getPresetTokens();
    const { nativeToken } = tokens;

    return combineLatest({
      txFee:
        token === nativeToken.name
          ? this.estimateTxFee(
            {
              amount: FixedPointNumber.ZERO,
              to,
              token,
              address: to === 'moonriver' || to === 'moonbeam' ? '0x0000000000000000000000000000000000000000' : address,
              signer: address
            }
          )
          : '0',
      balance: this.wallet.subscribeBalance(token, address).pipe(map((i) => i.available))
    }).pipe(
      map(({ balance, txFee }) => {
        const feeFactor = 1.2;
        const fee = FixedPointNumber.fromInner(txFee, nativeToken.decimals || 12).mul(new FixedPointNumber(feeFactor));

        return balance.minus(fee);
      })
    );
  }

  public createTx (params: CrossChainTransferParams): SubmittableExtrinsic<'promise', ISubmittableResult> | SubmittableExtrinsic<'rxjs', ISubmittableResult> {
    if (this.api === undefined) {
      throw new ApiNotFound(this.chain.id);
    }

    const { address, amount, to, token } = params;

    const tokenFormSDK = this.wallet?.__getToken(token);
    const toChain = chains[to];

    const destFee = this.getCrossChainFee(token, to);
    const destWeight = this.getDestWeight(token, to);

    // to moonriver/moonbeam
    if (isChainEqual(toChain, 'moonriver') || isChainEqual(toChain, 'moonbeam')) {
      const dst = {
        parents: 1,
        interior: {
          X2: [{ Parachain: toChain.paraChainId }, { AccountKey20: { key: address, network: 'Any' } }]
        }
      };

      return token === 'KAR' || token === 'KUSD' || token === 'MOVR' || token === 'ACA' || token === 'AUSD' || token === 'GLMR'
        ? this.api.tx.xTokens.transfer(tokenFormSDK?.toChainData() as any, amount.toChainData(), { V1: dst }, destWeight?.toString())
        : this.api.tx.xTokens.transferMulticurrencies(
          [
            [tokenFormSDK?.toChainData() as any, amount.toChainData()],
            [{ Token: destFee.token }, destFee.balance.toChainData()]
          ],
          1,
          { V1: dst },
          destWeight?.toString());
    }

    const accountId = this.api?.createType('AccountId32', address).toHex();

    // to other parachains
    let dst: any = {
      parents: 1,
      interior: {
        X2: [{ Parachain: toChain.paraChainId }, { AccountId32: { id: accountId, network: 'Any' } }]
      }
    };

    // to relay-chain
    if (isChainEqual(toChain, 'kusama') || isChainEqual(toChain, 'polkadot')) {
      dst = { interior: { X1: { AccountId32: { id: accountId, network: 'Any' } } }, parents: 1 };
    }

    return isChainEqual(toChain, 'statemine')
      ? this.api.tx.xTokens.transferMulticurrencies(
        [
          [tokenFormSDK?.toChainData(), amount.toChainData()],
          [{ Token: destFee.token }, destFee.balance.toChainData()]
        ],
        1,
        { V1: dst },
        destWeight?.toString())
      : this.api.tx.xTokens.transfer(tokenFormSDK?.toChainData() as any, amount.toChainData(), { V1: dst }, destWeight?.toString());
  }
}

export class AcalaAdapter extends BaseAcalaAdapter {
  constructor () {
    super(chains.acala, routersConfig.acala);
  }
}

export class KaruraAdapter extends BaseAcalaAdapter {
  constructor () {
    super(chains.karura, routersConfig.karura);
  }
}
