import { isChainEqual } from "./utils/is-chain-equal";
import { chains } from "./configs";
import { BridgeRouterManager } from "./cross-chain-router";
import { RouteConfigs } from "./types";

describe("cross-chain-router-manager", () => {
  let manager: BridgeRouterManager;

  jest.setTimeout(300000);

  const initSDK = async () => {
    if (manager) {
      return manager;
    }

    manager = new BridgeRouterManager();

    await manager.addRouters(
      [
        { from: chains.karura.id, to: chains.kusama.id, token: "KSM" },
        { from: chains.karura.id, to: chains.khala.id, token: "KSM" },
        { from: chains.karura.id, to: chains.khala.id, token: "AUSD" },
        { from: chains.karura.id, to: chains.khala.id, token: "LKSM" },
        { from: chains.khala.id, to: chains.karura.id, token: "KSM" },
        { from: chains.khala.id, to: chains.karura.id, token: "AUSD" },
        { from: chains.khala.id, to: chains.karura.id, token: "LKSM" },
        { from: chains.kusama.id, to: chains.karura.id, token: "KSM" },
        { from: chains.assetHubKusama.id, to: chains.karura.id, token: "RMRK" },
      ] as RouteConfigs[],
      false
    );

    return manager;
  };

  test("isChainEqual should be ok", () => {
    expect(isChainEqual(chains.karura, chains.karura)).toBe(true);
    expect(isChainEqual(chains.karura, "karura")).toBe(true);
    expect(isChainEqual(chains.karura, "kusama")).toBe(false);
    expect(isChainEqual("karura", chains.karura)).toBe(true);
    expect(isChainEqual("kusama", chains.karura)).toBe(false);
  });

  test("getRouter should be ok", async () => {
    const r1 = manager.getRouters({ from: "karura" });
    // const r2 = manager.getRouters({ from: "khala" });
    const r3 = manager.getRouters({ from: "karura", to: "khala" });
    const r4 = manager.getRouters({ from: "karura", to: "khala", token: "AUSD" });
    const r5 = manager.getRouters({ to: "karura" });
    const r6 = manager.getRouters({ to: "karura", token: "AUSD" });
    const r7 = manager.getRouters({ token: "AUSD" });
    const r8 = manager.getRouters({ token: "RMRK" });
    const r9 = manager.getRouters();

    expect(r1.length).toEqual(4);
    // expect(r2.length).toEqual(3);
    expect(r3.length).toEqual(3);
    expect(r4.length).toEqual(1);
    expect(r5.length).toEqual(5);
    expect(r6.length).toEqual(1);
    expect(r7.length).toEqual(2);
    expect(r8.length).toEqual(1);
    expect(r9.length).toEqual(9);
  });

  test("get* should be ok", async () => {
    const r1 = manager.getDestinationChains({ from: "karura" });
    const r2 = manager.getFromChains({ to: "karura" });

    expect(r1.length).toEqual(2);
    expect(r1[0].display).toEqual("Kusama");
    expect(r1[1].display).toEqual("Khala");
    expect(r2.length).toEqual(3);
    expect(r2[0].display).toEqual("Khala");
    expect(r2[1].display).toEqual("Kusama");
    expect(r2[2].display).toEqual("Asset Hub Kusama");
  });

  test("filter by disabled routers should be ok", async () => {
    const all = manager.getRouters();
    // return all routers if no disabled routers
    manager.disabledRouters = [];
    const r1 = manager.getAvailableRouters();
    expect(r1.length).toEqual(all.length);

    // filter out 1 router if 1 router is disabled
    manager.disabledRouters = [{ from: "karura", to: "khala", token: "AUSD" }];
    const r2 = manager.getAvailableRouters();
    expect(r2.length).toEqual(all.length - 1);

    // filter out 3 routers if 3 karura -> khala routers are disabled
    manager.disabledRouters = [{ from: "karura", to: "khala" }];
    const r3 = manager.getAvailableRouters();
    expect(r3.length).toEqual(all.length - 3);

    // filter out 4 karura routers if 4 karura routers are disabled
    manager.disabledRouters = [{ from: "karura" }];
    const r4 = manager.getAvailableRouters();
    expect(r4.length).toEqual(all.length - 4);
  });

  beforeAll(async () => {
    try {
      await initSDK();
    } catch (err) {
      // ignore node disconnect issue
    }
  });
});
