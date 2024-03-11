import { FixedPointNumber } from "@acala-network/sdk-core";
import { firstValueFrom } from "rxjs";

import { ApiProvider } from "../api-provider";
import { chains, ChainId } from "../configs";
import { Bridge } from "../bridge";
import { KusamaAdapter, PolkadotAdapter } from "./polkadot";
import { BasiliskAdapter, HydraDxAdapter } from "./hydradx";
import { AssetHubKusamaAdapter, AssetHubPolkadotAdapter } from "./assethub";
import { AcalaAdapter, KaruraAdapter } from "./acala/acala";
import { BaseCrossChainAdapter } from "../base-chain-adapter";
import { logFormatedRoute, formateRouteLogLine } from "../utils/unit-test";

describe.skip("polkadot-adapter should work", () => {
  jest.setTimeout(300000);

  const testAccount = "5GREeQcGHt7na341Py6Y6Grr38KUYRvVoiFSiDB52Gt7VZiN";
  const adapters: Record<string, BaseCrossChainAdapter> = {
    kusama: new KusamaAdapter(),
    karura: new KaruraAdapter(),
    basilisk: new BasiliskAdapter(),
    assetHubKusama: new AssetHubKusamaAdapter(),
    polkadot: new PolkadotAdapter(),
    acala: new AcalaAdapter(),
    hydradx: new HydraDxAdapter(),
    assetHubPolkadot: new AssetHubPolkadotAdapter(),
  };
  const provider = new ApiProvider();
  let bridge: Bridge;
  const outputSummary: string[] = [];

  afterAll(async () => {
    for (const adapter of bridge.adapters) {
      const api = adapter.getApi();

      if (api) {
        await api.disconnect();
      }
    }

    await new Promise((resolve) => setTimeout(() => resolve(undefined), 5000));

    logFormatedRoute("Polkadot/Kusama summary:\n", outputSummary);
  });

  async function connect(chains: ChainId[]) {
    return firstValueFrom(provider.connectFromChain(chains, undefined));
  }

  const fromChains = ["kusama", "polkadot"] as ChainId[];

  test("connect kusama/polkadot should work", async () => {
    try {
      await connect(fromChains);

      await adapters.kusama.init(provider.getApi(fromChains[0]));
      await adapters.polkadot.init(provider.getApi(fromChains[1]));

      bridge = new Bridge({
        adapters: Object.values(adapters),
      });

      expect(bridge.router.getDestinationChains({ from: chains.kusama, token: "KSM" }).length).toBeGreaterThanOrEqual(1);
    } catch (err) {
      // ignore node disconnected error
    }
  });

  fromChains.forEach((fromChain) => {
    test(`connect ${fromChain} to do xcm`, async () => {
      const adapter = bridge.findAdapter(fromChain);
      expect(adapter).toBeDefined();

      const testRoute = async (e) => {
        // TODO: add DOT to hydradx tokensConfig to fix this
        if (e.token === "DOT" && e.to === "hydradx") return;

        const balance = await firstValueFrom(adapter.subscribeTokenBalance(e.token, testAccount));

        const balanceLog = formateRouteLogLine(e.token, e.from, e.to, "balance");
        logFormatedRoute("", [balanceLog]);
        outputSummary.push(balanceLog);
        expect(balance.available.toNumber()).toBeGreaterThanOrEqual(0);
        expect(balance.free.toNumber()).toBeGreaterThanOrEqual(balance.available.toNumber());
        expect(balance.free.toNumber()).toEqual(balance.locked.add(balance.available).toNumber());

        const inputConfig = await firstValueFrom(
          adapter.subscribeInputConfig({ to: e.to, token: e.token, address: testAccount, signer: testAccount })
        );

        const inputConfigLog = formateRouteLogLine(e.token, e.from, e.to, "inputConfig");
        logFormatedRoute("", [inputConfigLog]);
        outputSummary.push(inputConfigLog);
        expect(inputConfig.minInput.toNumber()).toBeGreaterThan(0);
        expect(inputConfig.maxInput.toNumber()).toBeLessThanOrEqual(balance.available.toNumber());

        const destFee = adapter.getCrossChainFee(e.token, e.to);

        const destFeeLog = formateRouteLogLine(e.token, e.from, e.to, "destFee");
        logFormatedRoute("", [destFeeLog]);
        outputSummary.push(destFeeLog);
        expect(destFee.balance.toNumber()).toBeGreaterThan(0);

        const token = adapter.getToken(e.token);
        const tx = adapter.createTx({
          amount: new FixedPointNumber(0.01, token.decimals),
          to: e.to,
          token: e.token,
          address: testAccount,
        });

        expect(tx).toBeDefined();
        expect(tx.method.section).toEqual("xcmPallet");
        if (e.to === "assetHubKusama" || e.to === "assetHubPolkadot") {
          expect(tx.method.method).toEqual("limitedTeleportAssets");
        } else {
          expect(tx.method.method).toEqual("limitedReserveTransferAssets");
        }

        const createTxLog = formateRouteLogLine(e.token, e.from, e.to, "createTx");
        logFormatedRoute("", [createTxLog]);
        outputSummary.push(createTxLog);
      };

      const allRoutes = adapter.getRouters();
      await Promise.all(allRoutes.map((e) => testRoute(e)));
    });
  });
});
