import { Wallet } from '@acala-network/sdk/wallet';
import { AnyApi, FixedPointNumber } from '@acala-network/sdk-core';
import { catchError, combineLatest, firstValueFrom, map, Observable, of } from 'rxjs';
import { TokenConfigNotFound } from 'src/errors';

import { ApiRx } from '@polkadot/api';

import { BaseCrossChainAdapter } from '../base-chain-adapter';
import { chains, RegisteredChainName } from '../configs';
import { xcmFeeConfig } from '../configs/xcm-fee';
import { BalanceData, BridgeTxParams, Chain, CrossChainRouter, CrossChainTransferParams, TokenBalance } from '../types';
import { isChainEqual } from '../utils/is-chain-equal';

export class BaseAcalaAdapter extends BaseCrossChainAdapter {
  private wallet?: Wallet;

  constructor (chain: Chain, routers: Omit<CrossChainRouter, 'from'>[]) {
    super(chain, routers);
  }

  public override async setApi (api: AnyApi) {
    this.api = api;

    if (this.api?.type === 'rxjs') {
      await firstValueFrom(api.isReady as Observable<ApiRx>);
    }

    await api.isReady;

    this.wallet = new Wallet(api);

    await this.wallet.isReady;
  }

  public override subscribeMinInput (token: string, to: RegisteredChainName): Observable<FixedPointNumber> {
    if (!this.wallet) {
      return new Observable((sub) => sub.next(FixedPointNumber.ZERO));
    }

    return of(this.getDestED(token, to).balance.add(this.getCrossChainFee(token, to)?.balance || FixedPointNumber.ZERO));
  }

  public subscribeTokenBalance (token: string, address: string): Observable<BalanceData> {
    const zeroResult: Observable<BalanceData> = new Observable((sub) =>
      sub.next({
        free: FixedPointNumber.ZERO,
        locked: FixedPointNumber.ZERO,
        available: FixedPointNumber.ZERO,
        reserved: FixedPointNumber.ZERO
      })
    );

    if (!this.wallet) {
      return zeroResult;
    }

    return this.wallet.subscribeBalance(token, address).pipe(catchError((_) => zeroResult));
  }

  public subscribeMaxInput (token: string, address: string, to: RegisteredChainName): Observable<FixedPointNumber> {
    if (!this.wallet) {
      return new Observable((sub) => sub.next(FixedPointNumber.ZERO));
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
              address: to === 'moonriver' || to === 'moonbeam' ? '0x0000000000000000000000000000000000000000' : address
            },
            address
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

  public override getCrossChainFee (token: string, destChain: RegisteredChainName): TokenBalance {
    if (!xcmFeeConfig[destChain][token]) {
      throw new TokenConfigNotFound(token, destChain);
    }

    return {
      token,
      balance: FixedPointNumber.fromInner((xcmFeeConfig[destChain][token]?.fee) ?? '0', this.wallet?.__getToken(token).decimals)
    };
  }

  public override getDestED (token: string, destChain: RegisteredChainName): TokenBalance {
    if (!xcmFeeConfig[destChain][token]) {
      throw new TokenConfigNotFound(token, destChain);
    }

    return {
      token,
      balance: FixedPointNumber.fromInner(
        (xcmFeeConfig[destChain][token]?.existentialDeposit) ?? '0',
        this.wallet?.__getToken(token).decimals
      )
    };
  }

  public getBridgeTxParams (params: CrossChainTransferParams): BridgeTxParams {
    const { address, amount, to, token } = params;
    const tokenFormSDK = this.wallet?.__getToken(token);
    const toChain = chains[to];

    const dest_weight = 5 * 1_000_000_000;

    // to moonriver/moonbeam
    if (isChainEqual(toChain, 'moonriver') || isChainEqual(toChain, 'moonbeam')) {
      const dst = {
        parents: 1,
        interior: {
          X2: [{ Parachain: toChain.paraChainId }, { AccountKey20: { key: address, network: 'Any' } }]
        }
      };

      return token === 'KAR' || token === 'KUSD' || token === 'MOVR' || token === 'ACA' || token === 'AUSD' || token === 'GLMR'
        ? {
          module: 'xTokens',
          call: 'transfer',
          params: [tokenFormSDK?.toChainData() as any, amount.toChainData(), { V1: dst }, dest_weight]
        }
        : {
          module: 'xTokens',
          call: 'transferMulticurrencies',
          params: [
            [
              [tokenFormSDK?.toChainData() as any, amount.toChainData()],
              [{ Token: 'KAR' }, xcmFeeConfig[to][token].fee]
            ],
            1,
            { V1: dst },
            dest_weight
          ]
        };
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
      ? {
        module: 'xTokens',
        call: 'transferMulticurrencies',
        params: [
          [
            [tokenFormSDK?.toChainData(), amount.toChainData()],
            [{ Token: 'KSM' }, xcmFeeConfig[to][token].fee]
          ],
          1,
          { V1: dst },
          dest_weight
        ]
      }
      : {
        module: 'xTokens',
        call: 'transfer',
        params: [tokenFormSDK?.toChainData() as any, amount.toChainData(), { V1: dst }, dest_weight]
      };
  }
}

export class AcalaAdapter extends BaseAcalaAdapter {
  constructor () {
    super(chains.acala, [
      // polkadot
      { to: chains.polkadot, token: 'DOT' },
      // moonbeam
      { to: chains.moonbeam, token: 'GLMR' },
      { to: chains.moonbeam, token: 'ACA' },
      { to: chains.moonbeam, token: 'AUSD' },
      // parallel
      { to: chains.parallel, token: 'ACA' },
      { to: chains.parallel, token: 'AUSD' },
      { to: chains.parallel, token: 'LDOT' },
      { to: chains.parallel, token: 'PARA' },
      // interlay
      { to: chains.interlay, token: 'INTR' }
    ]);
  }
}

export class KaruraAdapter extends BaseAcalaAdapter {
  constructor () {
    super(chains.karura, [
      // kusama
      { to: chains.kusama, token: 'KSM' },
      // bifrost
      { to: chains.bifrost, token: 'KAR' },
      { to: chains.bifrost, token: 'KUSD' },
      { to: chains.bifrost, token: 'BNC' },
      { to: chains.bifrost, token: 'VSKSM' },
      // statemine
      { to: chains.statemine, token: 'RMRK' },
      { to: chains.statemine, token: 'ARIS' },
      { to: chains.statemine, token: 'USDT' },
      // quartz
      { to: chains.quartz, token: 'QTZ' },
      // kintsugi
      { to: chains.kintsugi, token: 'KINT' },
      { to: chains.kintsugi, token: 'KBTC' },
      // khala
      { to: chains.khala, token: 'KAR' },
      { to: chains.khala, token: 'KUSD' },
      { to: chains.khala, token: 'PHA' },
      // heiko
      { to: chains.heiko, token: 'KAR' },
      { to: chains.heiko, token: 'KUSD' },
      { to: chains.heiko, token: 'LKSM' },
      { to: chains.heiko, token: 'HKO' },
      // moon
      { to: chains.moonriver, token: 'KAR' },
      { to: chains.moonriver, token: 'KUSD' },
      { to: chains.moonriver, token: 'MOVR' },
      // kico
      { to: chains.kico, token: 'KAR' },
      { to: chains.kico, token: 'KUSD' },
      { to: chains.kico, token: 'KICO' },
      // crust shadow
      { to: chains.shadow, token: 'CSM' },
      // calamari
      { to: chains.calamari, token: 'KAR' },
      { to: chains.calamari, token: 'KUSD' },
      { to: chains.calamari, token: 'LKSM' },
      { to: chains.calamari, token: 'KMA' },
      // integritee
      { to: chains.integritee, token: 'TEER' },
      // altair
      { to: chains.altair, token: 'KUSD' },
      { to: chains.altair, token: 'AIR' },
      // crab
      { to: chains.crab, token: 'CRAB' },
      // turing
      { to: chains.turing, token: 'KAR' },
      { to: chains.turing, token: 'KUSD' },
      { to: chains.turing, token: 'LKSM' },
      { to: chains.turing, token: 'TUR' },
      // pichiu
      { to: chains.pichiu, token: 'KAR' },
      { to: chains.pichiu, token: 'KUSD' },
      { to: chains.pichiu, token: 'LKSM' },
      { to: chains.pichiu, token: 'PCHU' },
      // shiden
      { to: chains.shiden, token: 'SDN' },
      { to: chains.shiden, token: 'KUSD' }
    ]);
  }
}
