import { firstValueFrom } from "rxjs";

import { BaseCrossChainAdapter } from "../base-chain-adapter";
import { Bridge, ChainId, ApiProvider, FN, chains } from "../index";
import { KintsugiAdapter, InterlayAdapter } from "./interlay";
import { KusamaAdapter, PolkadotAdapter } from "./polkadot";
import { AssetHubKusamaAdapter, AssetHubPolkadotAdapter } from "./assethub";
import { HeikoAdapter, ParallelAdapter } from "./parallel";
import { AcalaAdapter, KaruraAdapter } from "./acala";
import { BifrostAdapter, BifrostPolkadotAdapter } from "./bifrost";
import { HydraDxAdapter } from "./hydradx";
import { AstarAdapter } from "./astar";

describe("Interlay/Kintsugi connections tests", () => {
    jest.setTimeout(30000);
  
    const provider = new ApiProvider();
  
    const availableAdapters: Record<string, BaseCrossChainAdapter> = {
        polkadot: new PolkadotAdapter(),
        interlay: new InterlayAdapter(),
        assetHubPolkadot: new AssetHubPolkadotAdapter(),
        acala: new AcalaAdapter(),
        parallel: new ParallelAdapter(),
        bifrostPolkadot: new BifrostPolkadotAdapter(),
        hydradx: new HydraDxAdapter(),
        astar: new AstarAdapter(),
        kusama: new KusamaAdapter(),
        kintsugi: new KintsugiAdapter(),
        assetHubKusama: new AssetHubKusamaAdapter(),
        karura: new KaruraAdapter(),
        heiko: new HeikoAdapter(),
        bifrost: new BifrostAdapter(),
    };
  
    const bridge = new Bridge({
      adapters: Object.values(availableAdapters),
    });

    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const printTx = (fromChain: ChainId, toChain: ChainId, token: string) => {
      // Alice test address
      const testAddress = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";
  
      const tx = availableAdapters[fromChain].createTx({
        to: toChain,
        token,
        amount: FN.fromInner("1000000000", 10),
        address: testAddress,
      });
      console.log(
        "transfer",
        token,
        "from",
        fromChain,
        "to",
        toChain + ": " + tx.method.toHex()
      );
    }
  
    function printBidirectionalTxs(chainA: ChainId, chainB: ChainId, token: any) {
      printTx(chainA, chainB, token);
      printTx(chainB, chainA, token);
    }

    afterAll(async () => {
        const chains = Object.keys(availableAdapters) as ChainId[];
        chains.forEach((chainId) => provider.disconnect(chainId));

        // fake wait
        await wait(3000);

    }, 6000);

    test("1. connect fromChain should be ok", async () => {
        const chains = Object.keys(availableAdapters) as ChainId[];
    
        expect(provider.getApi(chains[0])).toEqual(undefined);
        expect(provider.getApi(chains[1])).toEqual(undefined);
    
        // connect all adapters
        const connected = await firstValueFrom(
            provider.connectFromChain(chains, {
                polkadot: ["wss://polkadot-rpc.dwellir.com"],
                interlay: ["wss://api.interlay.io/parachain"],
                assetHubPolkadot: ["wss://statemint-rpc.dwellir.com"],
                acala: ["wss://acala-rpc.aca-api.network"],
                parallel: ["wss://parallel-rpc.dwellir.com"],
                bifrostPolkadot: ["wss://bifrost-polkadot-rpc.dwellir.com"],
                hydradx: ["wss://rpc.hydradx.cloud"],
                astar: ["wss://rpc.astar.network"],
                kusama: ["wss://kusama-rpc.dwellir.com"],
                kintsugi: ["wss://api-kusama.interlay.io/parachain"],
                assetHubKusama: ["wss://statemine-rpc.dwellir.com"],
                karura: ["wss://karura-rpc-0.aca-api.network"],
                heiko: ["wss://heiko-rpc.parallel.fi"],
                bifrost: ["wss://bifrost-rpc.dwellir.com"],
            })
        );
        // and set apiProvider for each adapter
        await Promise.all(
          chains.map((chain) =>
            availableAdapters[chain].init(provider.getApi(chain))
          )
        );
    });
    
    test("2. token balance query & create tx should be ok", async () => {
      const chain: ChainId = "interlay";
      const toChain: ChainId = "polkadot";
      const token = "DOT";
      const testAddress = "23M5ttkmR6Kco7bReRDve6bQUSAcwqebatp3fWGJYb4hDSDJ";
  
      const balance = await firstValueFrom(
        availableAdapters[chain].subscribeTokenBalance(token, testAddress)
      );
  
      expect(balance.free.toNumber()).toBeGreaterThanOrEqual(0);
      expect(balance.available.toNumber()).toBeGreaterThanOrEqual(0);
  
      const available = availableAdapters[chain].subscribeInputConfig({
        to: toChain,
        token,
        address: testAddress,
        signer: testAddress,
      });
  
      const inputConfig = await firstValueFrom(available);
  
      expect(inputConfig.estimateFee.balance.toNumber()).toBeGreaterThan(0);
      expect(inputConfig.minInput.toNumber()).toBeGreaterThan(0);
      expect(inputConfig.maxInput.toNumber()).toBeLessThanOrEqual(
        balance.available.toNumber()
      );
  
      const tx = availableAdapters[chain].createTx({
        to: toChain,
        token,
        amount: FN.fromInner("10000000000", 10),
        address: testAddress,
      });
  
      expect(tx.args.length).toBeGreaterThan(1);
    });
  
    test("3. all transfer tx should be constructable", async () => {
      // kintsugi
      printBidirectionalTxs("kintsugi", "kusama", "KSM");
      printBidirectionalTxs("kintsugi", "assetHubKusama", "USDT");
      printBidirectionalTxs("kintsugi", "heiko", "KBTC");
      printBidirectionalTxs("kintsugi", "karura", "KINT");
      printBidirectionalTxs("kintsugi", "karura", "KBTC");
      printBidirectionalTxs("kintsugi", "karura", "LKSM");
      printBidirectionalTxs("kintsugi", "bifrost", "VKSM");
      printBidirectionalTxs("kusama", "assetHubKusama", "KSM");
  
      // interlay
      printBidirectionalTxs("interlay", "polkadot", "DOT");
      printBidirectionalTxs("interlay", "assetHubPolkadot", "USDT");
      printBidirectionalTxs("interlay", "hydradx", "IBTC");
      printBidirectionalTxs("interlay", "hydradx", "INTR");
      printBidirectionalTxs("interlay", "acala", "INTR");
      printBidirectionalTxs("interlay", "acala", "IBTC");
      printBidirectionalTxs("interlay", "parallel", "INTR");
      printBidirectionalTxs("interlay", "parallel", "IBTC");
      printBidirectionalTxs("interlay", "astar", "INTR");
      printBidirectionalTxs("interlay", "astar", "IBTC");
      printBidirectionalTxs("interlay", "bifrostPolkadot", "VDOT");
      printBidirectionalTxs("polkadot", "assetHubPolkadot", "DOT");
    });
  
    test("4. getting native token should work", () => {
      const testCases: [ChainId, string][] = [
        // kusama network
        ["kusama", "KSM"],
        ["kintsugi", "KINT"],
        ["karura", "KAR"],
        ["bifrost", "BNC"],
        ["heiko", "HKO"],
        ["assetHubKusama", "KSM"],
        // polkadot network
        ["polkadot", "DOT"],
        ["interlay", "INTR"],
        ["acala", "ACA"],
        ["hydradx", "HDX"],
        ["parallel", "PARA"],
        ["bifrostPolkadot", "BNC"],
        ["assetHubPolkadot", "DOT"],
      ];

      for (const [chainId, expectedNativeTokenSymbol] of testCases) {
        const adapter = bridge.router.findAdapterByName(chainId);
        if (!adapter) {
          fail(`Unable to find adapter for chain: ${chainId}`);
        }

        const nativeTokenSymbol = adapter.getApi()!.registry.chainTokens[0];

        const nativeToken = adapter.getToken(nativeTokenSymbol);
        expect(nativeToken.symbol).toBe(expectedNativeTokenSymbol);
      }
    });
  });