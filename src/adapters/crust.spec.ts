import { Bridge } from "../bridge";
import { FixedPointNumber } from "@acala-network/sdk-core";
import { formateRouteLogLine, logFormatedRoute } from "../utils/unit-test";
import { ApiProvider } from "../api-provider";
import { firstValueFrom } from "rxjs";
import { ShadowAdapter } from "./crust";

describe.skip("shadow adapter should work", () => {
  jest.setTimeout(300000);

  const address = "5GREeQcGHt7na341Py6Y6Grr38KUYRvVoiFSiDB52Gt7VZiN";
  let bridge: Bridge;
  const provider = new ApiProvider();
  const outputSummary: string[] = [];

  beforeAll(async () => {
    const shadow = new ShadowAdapter();

    await firstValueFrom(provider.connectFromChain(["shadow"]));

    await shadow.init(provider.getApi("shadow"));

    bridge = new Bridge({ adapters: [shadow] });
  });

  afterAll(async () => {
    for (const adapter of bridge.adapters) {
      const api = adapter.getApi();

      if (api) {
        await api.disconnect();
      }
    }

    await new Promise((resolve) => setTimeout(() => resolve(undefined), 5000));

    logFormatedRoute("shadow summary:\n", outputSummary);
  });

  test("bridge sdk init should work", (done) => {
    expect(bridge).toBeDefined();

    done();
  });

  test("transfer tokens out of shadow should work", (done) => {
    try {
      const adapter = bridge.findAdapter("shadow");
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
