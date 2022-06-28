import { chains, RegisteredChainName } from "../configs";
import { ApiProvider } from "../api-provider";
import { firstValueFrom } from "rxjs";
import { Bridge } from "../cross-chain-router";
import { KaruraAdapter } from "./acala";
import { FixedPointNumber } from "@acala-network/sdk-core";

describe("acala-adapter should work", () => {
  jest.setTimeout(30000);

  const testAccount = "5GREeQcGHt7na341Py6Y6Grr38KUYRvVoiFSiDB52Gt7VZiN";
  const provider = new ApiProvider();

  async function connect(chain: RegisteredChainName) {
    return firstValueFrom(provider.connectFromChain([chain]));
  }

  test("connect karura to do xcm", async () => {
    const fromChain = "karura";
    await connect(fromChain);

    const karura = new KaruraAdapter();
    await karura.setApi(provider.getApi(fromChain));

    const bridge = new Bridge({
      adapters: [karura],
    });

    expect(bridge.getDestiantionsChains({ from: chains.karura, token: "KSM" }).length).toEqual(1);
    expect(bridge.getDestiantionsChains({ from: chains.karura, token: "KAR" }).length).toEqual(2);
    expect(bridge.getDestiantionsChains({ from: chains.karura, token: "KUSD" }).length).toEqual(2);

    const adapter = bridge.findAdapterByName(fromChain);

    if (adapter) {
      const networkProps = await adapter.getNetworkProperties();
      expect(networkProps.ss58Format).toEqual(8);
      expect(networkProps.tokenSymbol.length).toBeGreaterThanOrEqual(1);
      expect(networkProps.tokenSymbol[0]).toEqual("KAR");
      expect(networkProps.tokenDecimals.length).toBeGreaterThanOrEqual(1);
      expect(networkProps.tokenDecimals[0]).toEqual(12);
    }

    async function runMyTestSuit(to: RegisteredChainName, token: string) {
      if (adapter) {
        const balance = await firstValueFrom(adapter.subscribeTokenBalance(token, testAccount));
        console.log(
          `balance ${token}: free-${balance.free.toNumber()} locked-${balance.locked.toNumber()} available-${balance.available.toNumber()}`
        );
        expect(balance.available.toNumber()).toBeGreaterThanOrEqual(0);
        expect(balance.free.toNumber()).toBeGreaterThanOrEqual(balance.available.toNumber());
        expect(balance.free.toNumber()).toEqual(balance.locked.add(balance.available).toNumber());

        const inputConfig = await firstValueFrom(adapter.subscribeInputConfigs({ to, token, address: testAccount }));

        console.log(
          `inputConfig: min-${inputConfig.minInput.toNumber()} max-${inputConfig.maxInput.toNumber()} ss58-${inputConfig.ss58Prefix}`
        );
        expect(inputConfig.minInput.toNumber()).toBeGreaterThan(0);
        expect(inputConfig.maxInput.toNumber()).toBeLessThanOrEqual(balance.available.toNumber());

        const destFee = adapter.getCrossChainFee(token, to);
        console.log(`destFee: fee-${destFee.balance.toNumber()} ${destFee.token}`);
        expect(destFee.balance.toNumber()).toBeGreaterThan(0);

        const tx = adapter.getBridgeTxParams({
          amount: FixedPointNumber.fromInner("10000000000", 10),
          to,
          token,
          address: testAccount,
        });
        expect(tx.module).toEqual("xTokens");
        expect(tx.call).toEqual("transfer");
        expect(tx.params.length).toEqual(4);
      }
    }

    await runMyTestSuit("kusama", "KSM");
    await runMyTestSuit("bifrost", "KAR");
    await runMyTestSuit("bifrost", "KUSD");
    await runMyTestSuit("khala", "KAR");
    await runMyTestSuit("khala", "KUSD");
  });
});
