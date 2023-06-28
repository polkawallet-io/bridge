import { Bridge } from '../bridge';
import { AstarAdapter } from './astar';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { FixedPointNumber } from '@acala-network/sdk-core';

// TODO: fix astar xcm params to enable this test
describe.skip('astar adapter should work', () => {
  jest.setTimeout(300000);

  const address = '5GREeQcGHt7na341Py6Y6Grr38KUYRvVoiFSiDB52Gt7VZiN';
  let bridge: Bridge;

  beforeAll(async () => {
    const astar = new AstarAdapter();

    const astarApi = new ApiPromise({ provider: new WsProvider('wss://rpc.astar.network') });

    await astar.init(astarApi);

    bridge = new Bridge({
      adapters: [astar],
    });
  });

  test('bridge sdk init should work', (done) => {
    expect(bridge).toBeDefined();

    done();
  });

  test('transfer token out of astar should work', (done) => {
    try {
      const adapter = bridge.findAdapter('astar');
      expect(adapter).toBeDefined();

      if (!adapter) return;

      const allRoutes = bridge.router.getAvailableRouters();
      allRoutes.forEach(e => {
        const token = adapter.getToken(e.token);
  
        const tx = adapter.createTx({
          to: e.to.id,
          token: token.name,
          amount: new FixedPointNumber(1, token.decimals),
          address
        });
  
        expect(tx).toBeDefined();
        console.log(`transfer ${e.token} from ${e.from.display} to ${e.to.display} should work`)
      });

      done();
    } catch (e) {
      // ignore error
    }
  });
});
