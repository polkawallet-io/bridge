import { Bridge } from "../bridge";
import { FixedPointNumber } from "@acala-network/sdk-core";
import { formateRouteLogLine, logFormatedRoute } from "../utils/unit-test";
import { ApiProvider } from "../api-provider";
import { firstValueFrom } from "rxjs";
import { ChainId } from "../configs";
import { UniqueAdapter, QuartzAdapter } from "./unique";
import { ApiPromise, WsProvider } from "@polkadot/api";

// TODO: unique API can not connect in test, need to be fixed
describe.skip("unique adapter should work", () => {
  jest.setTimeout(300000);

  const address = "5GREeQcGHt7na341Py6Y6Grr38KUYRvVoiFSiDB52Gt7VZiN";
  let bridge: Bridge;
  const provider = new ApiProvider();
  const outputSummary: string[] = [];

  beforeAll(async () => {
    const unique = new UniqueAdapter();
    const quartz = new QuartzAdapter();

    await firstValueFrom(provider.connectFromChain(["unique", "quartz"]));

    await unique.init(provider.getApi("unique"));
    await quartz.init(provider.getApi("quartz"));

    // const statemineApi = new ApiPromise({ provider: new WsProvider("wss://statemine-rpc.dwellir.com") });
    // const statemintApi = new ApiPromise({ provider: new WsProvider("wss://statemint-rpc.dwellir.com") });

    // await unique.init(statemineApi);
    // await statemint.init(statemintApi);

    bridge = new Bridge({ adapters: [unique, quartz] });
  });

  afterAll(async () => {
    for (const adapter of bridge.adapters) {
      const api = adapter.getApi();

      if (api) {
        await api.disconnect();
      }
    }

    await new Promise((resolve) => setTimeout(() => resolve(undefined), 5000));

    logFormatedRoute("unique/quartz summary:\n", outputSummary);
  });

  test("bridge sdk init should work", (done) => {
    expect(bridge).toBeDefined();

    done();
  });

  ["unique", "quartz"].forEach((chain) => {
    test(`transfer tokens out of ${chain} should work`, (done) => {
      try {
        const adapter = bridge.findAdapter(chain as ChainId);
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
});
