import { Bridge } from "../bridge";
import { AstarAdapter, ShidenAdapter } from "./astar";
import { AcalaAdapter } from "./acala";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { FixedPointNumber } from "@acala-network/sdk-core";
import { ChainId } from "../configs";

describe.skip("astar adapter should work", () => {
  jest.setTimeout(50000);

  const address = "5GREeQcGHt7na341Py6Y6Grr38KUYRvVoiFSiDB52Gt7VZiN";
  let bridge: Bridge;

  beforeAll(async () => {
    const astar = new AstarAdapter();
    const shiden = new ShidenAdapter();
    const acala = new AcalaAdapter();

    const astarApi = new ApiPromise({ provider: new WsProvider("wss://rpc.astar.network") });
    const shidenApi = new ApiPromise({ provider: new WsProvider("wss://shiden-rpc.dwellir.com") });
    const acalaApi = new ApiPromise({ provider: new WsProvider("wss://acala-rpc-0.aca-api.network") });

    await astar.init(astarApi);
    await shiden.init(shidenApi);
    await acala.init(acalaApi);

    bridge = new Bridge({
      adapters: [astar, acala, shiden],
    });
  });

  afterAll(async () => {
    for (const adapter of bridge.adapters) {
      const api = adapter.getApi();

      if (api) {
        await api.disconnect();
      }
    }
  });

  test("bridge sdk init should work", (done) => {
    expect(bridge).toBeDefined();

    done();
  });

  ["astar", "shiden"].forEach((chainId) => {
    const tokens = chainId === "astar" ? ["AUSD", "ACA", "LDOT", "ASTR"] : ["KUSD", "SDN"];
    const destChain = chainId === "astar" ? "acala" : "karura";
    tokens.forEach((token) => {
      test(`transfer ${token} from ${chainId} to ${destChain} should work`, (done) => {
        try {
          const adapter = bridge.findAdapter(chainId as ChainId);

          expect(adapter).toBeDefined();

          if (!adapter) return;

          const t = adapter.getToken(token);

          const tx = adapter.createTx({
            to: destChain,
            token,
            amount: new FixedPointNumber(1, t.decimals),
            address,
          });

          expect(tx).toBeDefined();
          done();
        } catch (e) {
          // ignore error
        }
      });
    });
  });
});
