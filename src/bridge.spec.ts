import { ApiProvider } from "./api-provider";
import { BaseCrossChainAdapter } from "./base-chain-adapter";
import { PolkadotAdapter } from "./adapters/polkadot";
import { ChainId } from "./configs";
import { Bridge } from "./bridge";
import { AcalaAdapter } from "./adapters/acala";

describe("Bridge sdk usage", () => {
  jest.setTimeout(300000);

  const provider = new ApiProvider();

  const availableAdapters: Record<string, BaseCrossChainAdapter> = {
    polkadot: new PolkadotAdapter(),
    // kusama: new KusamaAdapter(),
    acala: new AcalaAdapter(),
    // karura: new KaruraAdapter(),
    // statemine: new StatemineAdapter(),
    // altair: new AltairAdapter(),
    // shiden: new ShidenAdapter(),
    // bifrost: new BifrostAdapter(),
    // calamari: new CalamariAdapter(),
    // shadow: new ShadowAdapter(),
    // crab: new CrabAdapter(),
    // integritee: new IntegriteeAdapter(),
    // quartz: new QuartzAdapter(),
  };

  const bridge = new Bridge({
    adapters: Object.values(availableAdapters),
  });

  afterAll(async () => {
    for (const adapter of bridge.adapters) {
      const api = adapter.getApi();

      if (api) {
        await api.disconnect();
      }
    }

    await new Promise((resolve) => setTimeout(() => resolve(undefined), 5000));
  });

  test("1. bridge init should be ok", async () => {
    expect(bridge.router.getRouters().length).toBeGreaterThanOrEqual(Object.keys(availableAdapters).length);
    expect(bridge.router.getDestinationChains({ from: "acala" }).length).toBeGreaterThanOrEqual(0);
    expect(bridge.router.getAvailableTokens({ from: "acala", to: "polkadot" }).length).toBeGreaterThanOrEqual(0);
  });

  test("2. find adapter should be ok", async () => {
    const chains = Object.keys(availableAdapters) as ChainId[];

    expect(bridge.findAdapter(chains[0])).toEqual(availableAdapters[chains[0]]);
    expect(bridge.findAdapter(chains[1])).toEqual(availableAdapters[chains[1]]);
  });
});
