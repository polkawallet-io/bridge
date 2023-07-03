import { Bridge } from "../bridge";
import { TuringAdapter } from "./oak";
import { logFormatedRoute, formateRouteLogLine } from "../utils/unit-test";
import { FixedPointNumber } from "@acala-network/sdk-core";
import { ApiProvider } from "../api-provider";
import { ApiPromise, WsProvider } from "@polkadot/api";

describe("oak adapter should work", () => {
  jest.setTimeout(300000);

  const address = "5GREeQcGHt7na341Py6Y6Grr38KUYRvVoiFSiDB52Gt7VZiN";
  const provider = new ApiProvider();
  let bridge: Bridge;
  const outputSummary: string[] = [];

  beforeAll(async () => {
    const turing = new TuringAdapter();

    const turingApi = new ApiPromise({ provider: new WsProvider("wss://turing-rpc.dwellir.com") });

    await turing.init(turingApi);

    bridge = new Bridge({
      adapters: [turing],
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
    logFormatedRoute("Turing summary:\n", outputSummary);
  });

  test("bridge sdk init should work", (done) => {
    expect(bridge).toBeDefined();

    done();
  });

  test("transfer tokens from turing should work", (done) => {
    try {
      const adapter = bridge.findAdapter("turing");
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
