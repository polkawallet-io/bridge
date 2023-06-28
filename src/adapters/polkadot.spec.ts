import { FixedPointNumber } from '@acala-network/sdk-core';
import { firstValueFrom } from 'rxjs';

import { ApiProvider } from '../api-provider';
import { chains, ChainId } from '../configs';
import { Bridge } from '../bridge';
import { KusamaAdapter, PolkadotAdapter } from './polkadot';
import { BasiliskAdapter, HydraAdapter } from './hydradx';
import { StatemineAdapter, StatemintAdapter } from './statemint';
import { AcalaAdapter, KaruraAdapter } from './acala/acala';
import { BaseCrossChainAdapter } from '../base-chain-adapter';

describe.skip('polkadot-adapter should work', () => {
  jest.setTimeout(300000);

  const testAccount = '5GREeQcGHt7na341Py6Y6Grr38KUYRvVoiFSiDB52Gt7VZiN';
  const adapters: Record<string, BaseCrossChainAdapter> = {
     kusama: new KusamaAdapter(),
     karura : new KaruraAdapter(),
     basilisk : new BasiliskAdapter(),
     statemine : new StatemineAdapter(),
     polkadot : new PolkadotAdapter(),
     acala : new AcalaAdapter(),
     hydradx : new HydraAdapter(),
     statemint : new StatemintAdapter(),
  };
  const provider = new ApiProvider();
  let bridge: Bridge;

  async function connect (chains: ChainId[]) {
    return firstValueFrom(provider.connectFromChain(chains, undefined));
  }

  const fromChains = ['kusama', 'polkadot'] as ChainId[];

  test('connect kusama/polkadot should work', async () => {
    await connect(fromChains);

    await adapters.kusama.init(provider.getApi(fromChains[0]));
    await adapters.polkadot.init(provider.getApi(fromChains[1]));

    bridge = new Bridge({
      adapters: Object.values(adapters),
    });

    expect(bridge.router.getDestinationChains({ from: chains.kusama, token: 'KSM' }).length).toBeGreaterThanOrEqual(1);
  });

  fromChains.forEach((fromChain) => {
    test(`connect ${fromChain} to do xcm`, async () => {
      const adapter = bridge.findAdapter(fromChain);
      expect(adapter).toBeDefined();
  
      const testRoute = async (e) => {
        // TODO: add DOT to hydradx tokensConfig to fix this
        if (e.token === 'DOT' && e.to === 'hydradx') return;

        const balance = await firstValueFrom(adapter.subscribeTokenBalance(e.token, testAccount));
  
        console.log(`[${e.from} -> ${e.to}] ${e.token} balance: free-${balance.free.toNumber()} locked-${balance.locked.toNumber()} available-${balance.available.toNumber()}`);
        expect(balance.available.toNumber()).toBeGreaterThanOrEqual(0);
        expect(balance.free.toNumber()).toBeGreaterThanOrEqual(balance.available.toNumber());
        expect(balance.free.toNumber()).toEqual(balance.locked.add(balance.available).toNumber());
  
        const inputConfig = await firstValueFrom(adapter.subscribeInputConfig({ to: e.to, token: e.token, address: testAccount, signer: testAccount }));
  
        console.log(
          `[${e.from} -> ${e.to}] ${e.token} inputConfig: min-${inputConfig.minInput.toNumber()} max-${inputConfig.maxInput.toNumber()} ss58-${inputConfig.ss58Prefix}`
        );
        expect(inputConfig.minInput.toNumber()).toBeGreaterThan(0);
        expect(inputConfig.maxInput.toNumber()).toBeLessThanOrEqual(balance.available.toNumber());
  
        const destFee = adapter.getCrossChainFee(e.token, e.to);
  
        console.log(`[${e.from} -> ${e.to}] ${e.token} destFee: ${destFee.balance.toNumber()} ${destFee.token}`);
        expect(destFee.balance.toNumber()).toBeGreaterThan(0);
  
        const token = adapter.getToken(e.token);
        const tx = adapter.createTx({
          amount: new FixedPointNumber(0.01, token.decimals),
          to: e.to,
          token: e.token,
          address: testAccount
        });
  
        expect(tx).toBeDefined();
        expect(tx.method.section).toEqual('xcmPallet');
        if (e.to === 'statemine' || e.to === 'statemint') {
          expect(tx.method.method).toEqual('limitedTeleportAssets');
        } else {
          expect(tx.method.method).toEqual('limitedReserveTransferAssets');
        }
        console.log(`[${e.from} -> ${e.to}] ${e.token} create tx works.`);
      }
  
      const allRoutes = adapter.getRouters();
      await Promise.all(allRoutes.map(e => testRoute(e)));
    });
  });
});
