import { Bridge } from "../bridge";
import { FixedPointNumber } from "@acala-network/sdk-core";
import { formateRouteLogLine, logFormatedRoute } from "../utils/unit-test";
import { AltairAdapter, CentrifugeAdapter } from "./centrifuge";
import { ApiProvider } from "../api-provider";
import { firstValueFrom } from "rxjs";
import { ChainId } from "../configs";

// TODO: centrifuge API can not connect in test, need to be fixed
describe.skip("centrifuge adapter should work", () => {
  jest.setTimeout(300000);

  const address = "5GREeQcGHt7na341Py6Y6Grr38KUYRvVoiFSiDB52Gt7VZiN";
  let bridge: Bridge;
  const provider = new ApiProvider();
  const outputSummary: string[] = [];

  beforeAll(async () => {
    const centri = new CentrifugeAdapter();
    const alt = new AltairAdapter();

    await firstValueFrom(provider.connectFromChain(["centrifuge", "altair"]));

    await centri.init(provider.getApi("centrifuge"));
    await alt.init(provider.getApi("altair"));

    bridge = new Bridge({ adapters: [centri, alt] });
  });

  afterAll(async () => {
    for (const adapter of bridge.adapters) {
      const api = adapter.getApi();

      if (api) {
        await api.disconnect();
      }
    }

    await new Promise((resolve) => setTimeout(() => resolve(undefined), 5000));

    logFormatedRoute("centrifuge/altair summary:\n", outputSummary);
  });

  test("bridge sdk init should work", (done) => {
    expect(bridge).toBeDefined();

    done();
  });

  ["centrifuge", "altair"].forEach((chain) => {
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
