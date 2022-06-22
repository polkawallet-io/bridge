import { WsProvider } from "@polkadot/rpc-provider";
import { ApiPromise } from "@polkadot/api";
import { options } from "@acala-network/api";
import { Wallet } from "@acala-network/sdk/wallet";
import { Bridge } from "./cross-chain-router";
import { chains } from "./configs";
import { isChainEqual } from "./utils/is-chain-equal";

describe.skip("cross-chain-router-manager", () => {
  let manager: Bridge;
  let api: ApiPromise;
  let wallet: Wallet;

  jest.setTimeout(30000);

  const initSDK = async () => {
    if (manager) return manager;

    const endpoint = "wss://karura.api.onfinality.io/public-ws";
    const provider = new WsProvider(endpoint) as any;
    api = await ApiPromise.create(options({ provider }));

    await api.isReady;

    wallet = new Wallet(api);

    await wallet.isReady;

    manager = new Bridge();

    await manager.addRouters(
      [
        { from: chains.karura, to: chains.kusama, token: "KSM" },
        { from: chains.karura, to: chains.khala, token: "KSM" },
        { from: chains.karura, to: chains.khala, token: "AUSD" },
        { from: chains.karura, to: chains.khala, token: "LKSM" },
        { from: chains.khala, to: chains.karura, token: "KSM" },
        { from: chains.khala, to: chains.karura, token: "AUSD" },
        { from: chains.khala, to: chains.karura, token: "LKSM" },
        { from: chains.kusama, to: chains.karura, token: "KSM" },
        { from: chains.statemine, to: chains.karura, token: "RMRK" },
      ],
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
    const r1 = manager.getDestiantionsChains({ from: "karura" });
    const r2 = manager.getFromChains({ to: "karura" });

    expect(r1.length).toEqual(2);
    expect(r1[0].display).toEqual("Kusama");
    expect(r1[1].display).toEqual("Khala");
    expect(r2.length).toEqual(3);
    expect(r2[0].display).toEqual("Khala");
    expect(r2[1].display).toEqual("Kusama");
    expect(r2[2].display).toEqual("Statemine");
  });

  beforeAll(async () => {
    await initSDK();
  });
});
