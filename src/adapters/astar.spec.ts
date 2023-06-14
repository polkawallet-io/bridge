import { Bridge } from '../bridge';
import { AstarAdapter } from './astar';
import { AcalaAdapter } from './acala';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { FixedPointNumber } from '@acala-network/sdk-core';

describe.skip('astar adapter should work', () => {
  jest.setTimeout(50000);

  const address = '5GREeQcGHt7na341Py6Y6Grr38KUYRvVoiFSiDB52Gt7VZiN';
  let bridge: Bridge;

  beforeAll(async () => {
    const astar = new AstarAdapter();
    const acala = new AcalaAdapter();

    const astarApi = new ApiPromise({ provider: new WsProvider('wss://rpc.astar.network') });
    const acalaApi = new ApiPromise({ provider: new WsProvider('wss://acala-rpc-0.aca-api.network') });

    await astar.init(astarApi);
    await acala.init(acalaApi);

    bridge = new Bridge({
      adapters: [astar, acala],
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

  test('transfer ASTR from astar to acala should work', (done) => {
    try {
      const adapter = bridge.findAdapter('astar');

      expect(adapter).toBeDefined();

      if (!adapter) return;

      const astr = adapter.getToken('ASTR');

      const tx = adapter.createTx({
        to: 'acala',
        token: 'ASTR',
        amount: new FixedPointNumber(1, astr.decimals),
        address
      });

      expect(tx).toBeDefined();
      done();
    } catch (e) {
      // ignore error
    }
  });

  test('transfer ACA from shiden to karura should work', (done) => {
    try {

      const adapter = bridge.findAdapter('astar');

      expect(adapter).toBeDefined();

      if (!adapter) return;

      const aca = adapter.getToken('ACA');

      const tx = adapter.createTx({
        to: 'acala',
        token: 'ACA',
        amount: new FixedPointNumber(1, aca.decimals),
        address
      });

      expect(tx).toBeDefined();
      done();
    } catch (e) {
      // ignore error
    }
  });
});
