
import { firstValueFrom } from 'rxjs';

import { ApiProvider } from './api-provider';
import { BaseCrossChainAdapter } from './base-chain-adapter';
import { PolkadotAdapter } from './adapters/polkadot';
import { ChainName } from './configs';
import { Bridge } from './index';
import { AcalaAdapter } from './adapters/acala';
import { FN } from './types';

describe.skip('Bridge sdk usage', () => {
  jest.setTimeout(30000);

  const provider = new ApiProvider();

  const availableAdapters: Record<string, BaseCrossChainAdapter> = {
    polkadot: new PolkadotAdapter(),
    // kusama: new KusamaAdapter(),
    acala: new AcalaAdapter(),
    // karura: new KaruraAdapter(),
    // statemine: new StatemineAdapter(),
    // altair: new AltairAdapter(),
    // shiden: new ShidenAdapter(),
    // bifrost: new BifrostAdapter(),
    // calamari: new CalamariAdapter(),
    // shadow: new ShadowAdapter(),
    // crab: new CrabAdapter(),
    // integritee: new IntegriteeAdapter(),
    // quartz: new QuartzAdapter(),
  };

  const bridge = new Bridge({
    adapters: Object.values(availableAdapters),
  });

  test('1. bridge init should be ok', async () => {
    expect(bridge.router.getRouters().length).toBeGreaterThanOrEqual(Object.keys(availableAdapters).length);
    expect(bridge.router.getDestinationChains({from: 'acala'}).length).toBeGreaterThanOrEqual(0);
    expect(bridge.router.getAvailableTokens({from: 'acala', to: 'polkadot'}).length).toBeGreaterThanOrEqual(0);
  });

  test('2. connect fromChain should be ok', async () => {
    const chains = Object.keys(availableAdapters) as ChainName[];

    expect(provider.getApi(chains[0])).toEqual(undefined);
    expect(provider.getApi(chains[1])).toEqual(undefined);
  
    // connect all adapters
    const connected = await firstValueFrom(provider.connectFromChain(chains, undefined));
    // and set apiProvider for each adapter
    await Promise.all(chains.map((chain) => availableAdapters[chain].setApi(provider.getApi(chain))));

    expect(connected.length).toEqual(chains.length);

    expect(connected[0]).toEqual(chains[0]);
    expect(connected[1]).toEqual(chains[1]);

    expect(provider.getApi(chains[0])).toBeDefined();
    expect(provider.getApi(chains[1])).toBeDefined();

    expect((await firstValueFrom(provider.getApi(chains[0]).rpc.system.chain())).toLowerCase()).toEqual(chains[0]);
    expect((await firstValueFrom(provider.getApi(chains[1]).rpc.system.chain())).toLowerCase()).toEqual(chains[1]);

    setTimeout(async () => {
      expect((await provider.getApiPromise(chains[0]).rpc.system.chain()).toLowerCase()).toEqual(chains[0]);
      expect((await provider.getApiPromise(chains[1]).rpc.system.chain()).toLowerCase()).toEqual(chains[1]);
    }, 1000);
  });

  test('3. token balance query & create tx should be ok', async () => {
    const chain: ChainName = 'acala';
    const toChain: ChainName = 'polkadot';
    const token = 'DOT';
    const testAddress = '23M5ttkmR6Kco7bReRDve6bQUSAcwqebatp3fWGJYb4hDSDJ';

    const balance = await firstValueFrom(availableAdapters[chain].subscribeTokenBalance(token, testAddress));

    expect(balance.free.toNumber()).toBeGreaterThanOrEqual(0);
    expect(balance.available.toNumber()).toBeGreaterThanOrEqual(0);

    const inputConfig = await firstValueFrom(availableAdapters[chain].subscribeInputConfigs({to: toChain, token, address:testAddress, signer: testAddress}));

    expect(BigInt(inputConfig.estimateFee)).toBeGreaterThanOrEqual(BigInt(0));
    expect(inputConfig.minInput.toNumber()).toBeGreaterThan(0);
    expect(inputConfig.maxInput.toNumber()).toBeLessThanOrEqual(balance.available.toNumber());

    const tx = availableAdapters[chain].createTx({to: toChain, token, amount: FN.fromInner('10000000000', 10), address:testAddress, signer: testAddress});

    expect(tx.args.length).toBeGreaterThan(1);
  });
});
