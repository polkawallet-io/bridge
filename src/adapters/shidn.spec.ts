import { Bridge } from '../bridge';
import { ShidenAdapter } from './astar';
import { KaruraAdapter } from './acala';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { FixedPointNumber } from '@acala-network/sdk-core';

describe('shiden adapter should work', () => {
  jest.setTimeout(50000);

  const address = '5GREeQcGHt7na341Py6Y6Grr38KUYRvVoiFSiDB52Gt7VZiN';
  let bridge: Bridge;

  beforeAll(async () => {
    const shiden = new ShidenAdapter();
    const karura = new KaruraAdapter();

    const shidenApi = new ApiPromise({ provider: new WsProvider('wss://rpc.shiden.astar.network') });
    const karuraApi = new ApiPromise({ provider: new WsProvider('wss://karura-rpc-0.aca-api.network') });

    await shiden.init(shidenApi);
    await karura.init(karuraApi);

    bridge = new Bridge({
      adapters: [shiden, karura],
    });
  });

  afterAll(async () => {
    for (const adapter of bridge.adapters) {
      const api = adapter.getApi();

      if (api) {
        await api.disconnect();
      }
    }
  })

  test('bridge sdk init should work', (done) => {
    expect(bridge).toBeDefined();

    done();
  });

  test('transfer SDN from shiden to karura should work', (done) => {
    try {

      const adapter = bridge.findAdapter('shiden');

      expect(adapter).toBeDefined();

      if (!adapter) return;

      const sdn = adapter.getToken('SDN');

      const tx = adapter.createTx({
        to: 'karura',
        token: 'SDN',
        amount: new FixedPointNumber(1, sdn.decimals),
        address
      });

      expect(tx).toBeDefined();
      done();
    } catch (e) {
      // ignore error
    }
  });

  test('transfer KUSD from shiden to karura should work', (done) => {
    try {
      const adapter = bridge.findAdapter('shiden');

      expect(adapter).toBeDefined();

      if (!adapter) return;

      const kusd = adapter.getToken('KUSD');

      const tx = adapter.createTx({
        to: 'karura',
        token: 'KUSD',
        amount: new FixedPointNumber(1, kusd.decimals),
        address
      });

      expect(tx).toBeDefined();
      done();
    } catch (e) {
      // ignore error
    }
  });
});
