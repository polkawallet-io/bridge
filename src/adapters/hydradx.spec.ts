import { Bridge } from "../bridge";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { FixedPointNumber } from "@acala-network/sdk-core";
import { HydraDxAdapter } from "./hydradx";
import { formateRouteLogLine, logFormatedRoute } from "../utils/unit-test";

describe("hydradx adapter should work", () => {
  jest.setTimeout(300000);

  const address = "5GREeQcGHt7na341Py6Y6Grr38KUYRvVoiFSiDB52Gt7VZiN";
  let bridge: Bridge;
  const outputSummary: string[] = [];

  beforeAll(async () => {
    const hydradx = new HydraDxAdapter();

    const hydradxApi = new ApiPromise({ provider: new WsProvider("wss://hydradx.api.onfinality.io/public-ws") });

    await hydradx.init(hydradxApi);

    bridge = new Bridge({ adapters: [hydradx] });
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

  test("transfer tokens out of hydradx should work", (done) => {
    try {
      const adapter = bridge.findAdapter("hydradx");
      expect(adapter).toBeDefined();

      if (!adapter) return;

      const allRoutes = bridge.router.getAvailableRouters();
      allRoutes.forEach((e) => {
        const token = adapter.getToken(e.token);

        const tx = adapter.createTx({
          to: e.to.id,
          token: token.name,
          amount: new FixedPointNumber(1, token.decimals),
          address,
        });

        expect(tx).toBeDefined();

        const logRoute = formateRouteLogLine(e.token, e.from.display, e.to.display, "createTx");
        logFormatedRoute("", [logRoute]);
        outputSummary.push(logRoute);
      });

      done();
    } catch (e) {
      // ignore error
    }
  });
});
