import { Bridge } from "../bridge";
import { logFormatedRoute, formateRouteLogLine } from "../utils/unit-test";
import { FixedPointNumber } from "@acala-network/sdk-core";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { MoonbeamAdapter } from "./moonbeam";
import { AcalaAdapter } from "./acala/acala";

describe.skip("moonbeam adapter should work", () => {
  jest.setTimeout(300000);

  let bridge: Bridge;
  const outputSummary: string[] = [];

  beforeAll(async () => {
    const moonbeam = new MoonbeamAdapter();

    const moonbeamApi = new ApiPromise({ provider: new WsProvider("wss://moonbeam-rpc.dwellir.com") });

    await moonbeam.init(moonbeamApi);

    const acala = new AcalaAdapter();

    const acalaApi = new ApiPromise({ provider: new WsProvider("wss://acala-rpc.dwellir.com") });

    await acala.init(acalaApi);

    bridge = new Bridge({
      adapters: [moonbeam, acala],
    });
  });

  afterAll(async () => {
    for (const adapter of bridge.adapters) {
      const api = adapter.getApi();

      if (api) {
        await api.disconnect();
      }
    }

    await new Promise((resolve) => setTimeout(() => resolve(undefined), 5000));
    logFormatedRoute("Moonbeam summary:\n", outputSummary || []);
  });

  test("bridge sdk init should work", (done) => {
    expect(bridge).toBeDefined();

    done();
  });

  test("transfer tokens from moonbeam should work", (done) => {
    try {
      const adapter = bridge.findAdapter("moonbeam");
      expect(adapter).toBeDefined();

      if (!adapter) return;

      const allRoutes = bridge.router.getAvailableRouters();
      allRoutes.forEach((e) => {
        const token = adapter.getToken(e.token);

        const tx = adapter.createTx({
          to: e.to.id,
          token: token.name,
          amount: new FixedPointNumber(1, token.decimals),
          address: "5GREeQcGHt7na341Py6Y6Grr38KUYRvVoiFSiDB52Gt7VZiN",
        });

        expect(tx).toBeDefined();

        const logRoute = formateRouteLogLine(e.token, e.from.display, e.to.display, "createTx");
        logFormatedRoute("", [logRoute]);
        outputSummary.push(logRoute);
      });

      done();
    } catch (e) {
      // ignore error
      console.log(e);
    }
  });
});
