import { Bridge } from "../bridge";
import { ZeitgeistAdapter } from "./zeitgeist";
import { logFormatedRoute, formateRouteLogLine } from "../utils/unit-test";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { FixedPointNumber } from "@acala-network/sdk-core";
import { ApiProvider } from "../api-provider";
import { firstValueFrom } from "rxjs";

// TODO: zeitgeist API can not connect in test, need to be fixed
describe.skip("zeitgeist adapter should work", () => {
  jest.setTimeout(300000);

  const address = "5GREeQcGHt7na341Py6Y6Grr38KUYRvVoiFSiDB52Gt7VZiN";
  let bridge: Bridge;
  const provider = new ApiProvider();
  const outputSummary: string[] = [];

  beforeAll(async () => {
    const zeitgeist = new ZeitgeistAdapter();

    await firstValueFrom(provider.connectFromChain(["zeitgeist"]));

    await zeitgeist.init(provider.getApi("zeitgeist"));

    bridge = new Bridge({
      adapters: [zeitgeist],
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
    logFormatedRoute("zeitgeist summary:\n", outputSummary);
  });

  test("bridge sdk init should work", (done) => {
    expect(bridge).toBeDefined();

    done();
  });

  test("transfer tokens from zeitgeist should work", (done) => {
    try {
      const adapter = bridge.findAdapter("zeitgeist");
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
