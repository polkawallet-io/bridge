import { options } from '@acala-network/api';
import { Wallet } from '@acala-network/sdk/wallet';

import { ApiPromise } from '@polkadot/api';
import { WsProvider } from '@polkadot/rpc-provider';

import { isChainEqual } from './utils/is-chain-equal';
import { chains } from './configs';
import { BridgeRouterManager } from './cross-chain-router';
import { CrossChainRouterConfigs } from './';

describe.skip('cross-chain-router-manager', () => {
  let manager: BridgeRouterManager;
  let api: ApiPromise;
  let wallet: Wallet;

  jest.setTimeout(30000);

  const initSDK = async () => {
    if (manager) {
      return manager;
    }

    const endpoint = 'wss://kintsugi.api.onfinality.io/public-ws';
    const provider = new WsProvider(endpoint) as any;

    api = await ApiPromise.create(options({ provider }));

    await api.isReady;

    wallet = new Wallet(api);

    await wallet.isReady;

    manager = new BridgeRouterManager();

    await manager.addRouters(
      [
        { from: chains.kintsugi.id, to: chains.kusama.id, token: 'KSM' },
        { from: chains.kusama.id, to: chains.kintsugi.id, token: 'KSM' },
        { from: chains.statemine.id, to: chains.kintsugi.id, token: 'USDT' },
        { from: chains.kintsugi.id, to: chains.statemine.id, token: 'USDT' }
      ] as CrossChainRouterConfigs[],
      false
    );

    return manager;
  };

  test('isChainEqual should be ok', () => {
    expect(isChainEqual(chains.kintsugi, chains.kintsugi)).toBe(true);
    expect(isChainEqual(chains.kintsugi, 'kintsugi')).toBe(true);
    expect(isChainEqual(chains.kintsugi, 'kusama')).toBe(false);
    expect(isChainEqual('kintsugi', chains.kintsugi)).toBe(true);
    expect(isChainEqual('kusama', chains.kintsugi)).toBe(false);
  });

  test('getRouter should be ok', async () => {
    const r1 = manager.getRouters({ from: 'kintsugi' });
    const r2 = manager.getRouters({ from: 'kusama' });
    const r3 = manager.getRouters({ from: 'kintsugi', to: 'kusama' });
    const r4 = manager.getRouters({ from: 'kintsugi', to: 'kusama', token: 'KSM' });
    const r5 = manager.getRouters({ to: 'kintsugi' });
    const r6 = manager.getRouters({ to: 'kintsugi', token: 'USDT' });
    const r7 = manager.getRouters({ token: 'KSM' });
    const r8 = manager.getRouters({ token: 'USDT' });
    const r9 = manager.getRouters();

    expect(r1.length).toEqual(2);
    expect(r2.length).toEqual(1);
    expect(r3.length).toEqual(1);
    expect(r4.length).toEqual(1);
    expect(r5.length).toEqual(2);
    expect(r6.length).toEqual(1);
    expect(r7.length).toEqual(2);
    expect(r8.length).toEqual(2);
    expect(r9.length).toEqual(4);
  });

  test('get* should be ok', async () => {
    const r1 = manager.getDestinationChains({ from: 'kintsugi' });
    const r2 = manager.getFromChains({ to: 'kintsugi' });

    expect(r1.length).toEqual(2);
    expect(r2.length).toEqual(2);
  });

  beforeAll(async () => {
    await initSDK();
  });

  // test('get routers config should be ok', async () => {

  //   manager = new BridgeRouterManager();

  //   manager.addRouters(
  //     routersConfig.karura.map(e => ({...e, from: 'karura'})),
  //     false
  //   );

  //   const routers = manager.getRouters();
  //   console.log(routers[0].xcm?.weightLimit?.toString());
  //   expect(routers[0].xcm?.fee.token).toEqual('KSM');
  // });
});
