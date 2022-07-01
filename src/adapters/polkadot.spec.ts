import { chains, RegisteredChainName } from "../configs";
import { ApiProvider } from "../api-provider";
import { firstValueFrom } from "rxjs";
import { Bridge } from "../cross-chain-router";
import { KusamaAdapter } from "./polkadot";
import { FixedPointNumber } from "@acala-network/sdk-core";

describe("polkadot-adapter should work", () => {
  jest.setTimeout(30000);

  const testAccount = "5GREeQcGHt7na341Py6Y6Grr38KUYRvVoiFSiDB52Gt7VZiN";
  const provider = new ApiProvider();

  async function connect(chain: RegisteredChainName) {
    return firstValueFrom(provider.connectFromChain([chain], undefined));
  }

  test("connect kusama to do xcm", async () => {
    const fromChain = "kusama";
    await connect(fromChain);

    const kusama = new KusamaAdapter();
    await kusama.setApi(provider.getApi(fromChain));

    const bridge = new Bridge({
      adapters: [kusama],
    });

    expect(bridge.getDestiantionsChains({ from: chains.kusama, token: "KSM" }).length).toEqual(1);

    const kusamaAdapter = bridge.findAdapterByName(fromChain);
    if (kusamaAdapter) {
      const networkProps: any = await kusamaAdapter.getNetworkProperties();
      expect(networkProps.ss58Format).toEqual(2);
      expect(networkProps.tokenSymbol.length).toBeGreaterThanOrEqual(1);
      expect(networkProps.tokenSymbol[0]).toEqual("KSM");
      expect(networkProps.tokenDecimals.length).toBeGreaterThanOrEqual(1);
      expect(networkProps.tokenDecimals[0]).toEqual(12);

      const balance = await firstValueFrom(kusamaAdapter.subscribeTokenBalance("KSM", testAccount));
      console.log(`balance: free-${balance.free.toNumber()} locked-${balance.locked.toNumber()} available-${balance.available.toNumber()}`);
      expect(balance.available.toNumber()).toBeGreaterThanOrEqual(0);
      expect(balance.free.toNumber()).toBeGreaterThanOrEqual(balance.available.toNumber());
      expect(balance.free.toNumber()).toEqual(balance.locked.add(balance.available).toNumber());

      const inputConfig = await firstValueFrom(kusamaAdapter.subscribeInputConfigs({ to: "karura", token: "KSM", address: testAccount }));

      console.log(
        `inputConfig: min-${inputConfig.minInput.toNumber()} max-${inputConfig.maxInput.toNumber()} ss58-${inputConfig.ss58Prefix}`
      );
      expect(inputConfig.minInput.toNumber()).toBeGreaterThan(0);
      expect(inputConfig.maxInput.toNumber()).toBeLessThanOrEqual(balance.available.toNumber());

      const destFee = kusamaAdapter.getCrossChainFee("KSM", "karura");
      console.log(`destFee: ${destFee.balance.toNumber()} ${destFee.token}`);
      expect(destFee.balance.toNumber()).toBeGreaterThan(0);

      const tx = kusamaAdapter.getBridgeTxParams({
        amount: FixedPointNumber.fromInner("10000000000", 10),
        to: "karura",
        token: "KSM",
        address: testAccount,
      });
      expect(tx.module).toEqual("xcmPallet");
      expect(tx.call).toEqual("limitedReserveTransferAssets");
      expect(tx.params.length).toEqual(5);
    }
  });
});
