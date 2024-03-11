import { Bridge } from "../bridge";
import { FixedPointNumber } from "@acala-network/sdk-core";
import { formateRouteLogLine, logFormatedRoute } from "../utils/unit-test";
import { ApiProvider } from "../api-provider";
import { firstValueFrom } from "rxjs";
import { ChainId } from "../configs";
import { HeikoAdapter, ParallelAdapter } from "./parallel";

// TODO: parallel API can not connect in test, need to be fixed
describe.skip("parallel adapter should work", () => {
  jest.setTimeout(300000);

  const address = "5GREeQcGHt7na341Py6Y6Grr38KUYRvVoiFSiDB52Gt7VZiN";
  let bridge: Bridge;
  const provider = new ApiProvider();
  const outputSummary: string[] = [];

  beforeAll(async () => {
    const para = new ParallelAdapter();
    const heiko = new HeikoAdapter();

    await firstValueFrom(provider.connectFromChain(["parallel", "heiko"]));

    await para.init(provider.getApi("parallel"));
    await heiko.init(provider.getApi("heiko"));

    bridge = new Bridge({ adapters: [para, heiko] });
  });

  afterAll(async () => {
    for (const adapter of bridge.adapters) {
      const api = adapter.getApi();

      if (api) {
        await api.disconnect();
      }
    }

    await new Promise((resolve) => setTimeout(() => resolve(undefined), 5000));

    logFormatedRoute("parallel/heiko summary:\n", outputSummary);
  });

  test("bridge sdk init should work", (done) => {
    expect(bridge).toBeDefined();

    done();
  });

  ["parallel", "heiko"].forEach((chain) => {
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
