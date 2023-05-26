import { EvmRpcProvider } from "@acala-network/eth-providers";
import { Wallet } from "@acala-network/sdk";

import { FixedPointNumber } from "@acala-network/sdk-core";
import { firstValueFrom } from "rxjs";

import { ApiProvider } from "../api-provider";
import { chains, ChainId } from "../configs";
import { Bridge } from "../bridge";
import { KaruraAdapter, AcalaAdapter } from "./acala";
import { HydraAdapter } from "./hydradx";
import { KusamaAdapter } from "./polkadot";

describe.skip("acala-adapter should work", () => {
  jest.setTimeout(30000);

  const testAccount = "5GREeQcGHt7na341Py6Y6Grr38KUYRvVoiFSiDB52Gt7VZiN";
  const provider = new ApiProvider();

  async function connect(chains: ChainId[]) {
    // return firstValueFrom(provider.connectFromChain([chain], { karura: ["wss://crosschain-dev.polkawallet.io:9907"] }));
    return firstValueFrom(provider.connectFromChain(chains, undefined));
  }

  test("connect karura to do xcm", async () => {
    const fromChains = ["karura", "kusama"] as ChainId[];

    await connect(fromChains);

    const karura = new KaruraAdapter();
    const kusama = new KusamaAdapter();

    await karura.init(provider.getApi(fromChains[0]));
    await kusama.init(provider.getApi(fromChains[1]));

    const bridge = new Bridge({
      adapters: [karura, kusama],
    });

    expect(bridge.router.getDestinationChains({ from: chains.karura, token: "KSM" }).length).toEqual(1);

    const adapter = bridge.findAdapter(fromChains[0]);

    async function runMyTestSuit(to: ChainId, token: string) {
      if (adapter) {
        const balance = await firstValueFrom(adapter.subscribeTokenBalance(token, testAccount));

        console.log(
          `balance ${token}: free-${balance.free.toNumber()} locked-${balance.locked.toNumber()} available-${balance.available.toNumber()}`
        );
        expect(balance.available.toNumber()).toBeGreaterThanOrEqual(0);
        expect(balance.free.toNumber()).toBeGreaterThanOrEqual(balance.available.toNumber());
        expect(balance.free.toNumber()).toEqual(balance.locked.add(balance.available).toNumber());

        const inputConfig = await firstValueFrom(adapter.subscribeInputConfig({ to, token, address: testAccount, signer: testAccount }));

        console.log(
          `inputConfig: min-${inputConfig.minInput.toNumber()} max-${inputConfig.maxInput.toNumber()} ss58-${inputConfig.ss58Prefix}`
        );
        expect(inputConfig.minInput.toNumber()).toBeGreaterThan(0);
        expect(inputConfig.maxInput.toNumber()).toBeLessThanOrEqual(balance.available.toNumber());

        const destFee = adapter.getCrossChainFee(token, to);

        console.log(`destFee: fee-${destFee.balance.toNumber()} ${destFee.token}`);
        expect(destFee.balance.toNumber()).toBeGreaterThan(0);

        const tx = adapter.createTx({
          amount: FixedPointNumber.fromInner("10000000000", 10),
          to,
          token,
          address: testAccount,
          signer: testAccount,
        });

        if (to !== "statemine") {
          expect(tx.method.section).toEqual("xTokens");
          expect(tx.method.method).toEqual("transfer");
          expect(tx.args.length).toEqual(4);
        }
      }
    }

    // await runMyTestSuit('statemine', 'RMRK');
    await runMyTestSuit("kusama", "KSM");
    // await runMyTestSuit("bifrost", "KAR");
    // await runMyTestSuit("bifrost", "KUSD");
    // await runMyTestSuit("khala", "KAR");
    // await runMyTestSuit("khala", "KUSD");
  });
});

describe.skip("acala-adapter for erc20 token should work", () => {
  jest.setTimeout(30000);

  const testAccount = "5GREeQcGHt7na341Py6Y6Grr38KUYRvVoiFSiDB52Gt7VZiN";
  const provider = new ApiProvider();

  async function connect(chains: ChainId[]) {
    return firstValueFrom(provider.connectFromChain(chains, undefined));
  }

  test("connect acala to transfer erc20 token with xcm", async () => {
    const fromChains = ["acala", "hydradx"] as ChainId[];

    await connect(fromChains);

    const acala = new AcalaAdapter();
    const hydra = new HydraAdapter();

    const api = provider.getApiPromise(fromChains[0]);
    const evmProvider = new EvmRpcProvider("wss://acala.polkawallet.io");
    const wallet = new Wallet(api, { evmProvider });
    await acala.init(api, wallet);
    await hydra.init(provider.getApiPromise(fromChains[1]));

    const bridge = new Bridge({
      adapters: [acala, hydra],
    });

    expect(bridge.router.getDestinationChains({ from: chains.acala, token: "DAI" }).length).toEqual(1);

    const adapter = bridge.findAdapter(fromChains[0]);

    async function runMyTestSuit(to: ChainId, token: string) {
      if (adapter) {
        const balance = await firstValueFrom(adapter.subscribeTokenBalance(token, testAccount));

        console.log(
          `balance ${token}: free-${balance.free.toNumber()} locked-${balance.locked.toNumber()} available-${balance.available.toNumber()}`
        );
        expect(balance.available.toNumber()).toBeGreaterThanOrEqual(0);
        expect(balance.free.toNumber()).toBeGreaterThanOrEqual(balance.available.toNumber());
        expect(balance.free.toNumber()).toEqual(balance.locked.add(balance.available).toNumber());

        const inputConfig = await firstValueFrom(adapter.subscribeInputConfig({ to, token, address: testAccount, signer: testAccount }));

        console.log(
          `inputConfig: min-${inputConfig.minInput.toNumber()} max-${inputConfig.maxInput.toNumber()} ss58-${inputConfig.ss58Prefix}`
        );
        expect(inputConfig.minInput.toNumber()).toBeGreaterThan(0);
        expect(inputConfig.maxInput.toNumber()).toBeLessThanOrEqual(balance.available.toNumber());

        const destFee = adapter.getCrossChainFee(token, to);

        console.log(`destFee: fee-${destFee.balance.toNumber()} ${destFee.token}`);
        expect(destFee.balance.toNumber()).toBeGreaterThan(0);

        const tx = adapter.createTx({
          amount: FixedPointNumber.fromInner("10000000000", 10),
          to,
          token,
          address: testAccount,
          signer: testAccount,
        });

        if (to !== "statemine") {
          expect(tx.method.section).toEqual("xTokens");
          expect(tx.method.method).toEqual("transfer");
          expect(tx.args.length).toEqual(4);
        }
      }
    }

    await runMyTestSuit("hydradx", "DAI");
  });
});
