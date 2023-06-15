import { Bridge } from '../bridge';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { FixedPointNumber } from '@acala-network/sdk-core';
import { HydraAdapter } from './hydradx';
import { AcalaAdapter } from './acala';

describe.skip('hydradx adapter should work', () => {
  jest.setTimeout(50000);

  const address = '5GREeQcGHt7na341Py6Y6Grr38KUYRvVoiFSiDB52Gt7VZiN';
  let bridge: Bridge;

  beforeAll(async () => {
    const hydradx = new HydraAdapter();
    const acala = new AcalaAdapter();

    const hydradxApi = new ApiPromise({ provider: new WsProvider('wss://hydradx.api.onfinality.io/public-ws') });
    const acalaApi = new ApiPromise({ provider: new WsProvider('wss://acala-rpc-0.aca-api.network') });

    await hydradx.init(hydradxApi);
    await acala.init(acalaApi);

    bridge = new Bridge({ adapters: [hydradx, acala] });
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

  test('transfer DAI from hydradx to acala should work', (done) => {
    try {
      const adapter = bridge.findAdapter('hydradx');

      expect(adapter).toBeDefined();

      if (!adapter) return;

      const dai = adapter.getToken('DAI');

      const tx = adapter.createTx({
        to: 'acala',
        token: 'DAI',
        amount: new FixedPointNumber(1, dai.decimals),
        address
      });

      expect(tx).toBeDefined();
      done();
    } catch (e) {
      console.log(e);
    }
  });
});
