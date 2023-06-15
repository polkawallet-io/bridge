import { Bridge } from '../bridge';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { FixedPointNumber } from '@acala-network/sdk-core';
import { BasiliskAdapter } from './hydradx';
import { KaruraAdapter } from './acala';

describe.skip('basilisk adapter should work', () => {
  jest.setTimeout(50000);

  const address = '5GREeQcGHt7na341Py6Y6Grr38KUYRvVoiFSiDB52Gt7VZiN';
  let bridge: Bridge;

  beforeAll(async () => {
    const basilisk = new BasiliskAdapter();
    const karura= new KaruraAdapter();

    const basiliskApi = new ApiPromise({ provider: new WsProvider('wss://rpc.basilisk.cloud') });
    const karuraApi = new ApiPromise({ provider: new WsProvider('wss://karura-rpc-0.aca-api.network') });

    await basilisk.init(basiliskApi);
    await karura.init(karuraApi);

    bridge = new Bridge({ adapters: [basilisk, karura] });
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

  test('transfer BSX from basilisk to karura should work', (done) => {
    try {
      const adapter = bridge.findAdapter('basilisk');

      expect(adapter).toBeDefined();

      if (!adapter) return;

      const bsx = adapter.getToken('BSX');

      const tx = adapter.createTx({
        to: 'karura',
        token: 'BSX',
        amount: new FixedPointNumber(1, bsx.decimals),
        address
      });

      expect(tx).toBeDefined();
      done();
    } catch (e) {
      // ignore error
    }
  });

  test('transfer KUSD from basilisk to karura should work', (done) => {
    try {
      const adapter = bridge.findAdapter('basilisk');

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
