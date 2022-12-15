import { FixedPointNumber } from "@acala-network/sdk-core";
import { firstValueFrom } from "rxjs";

import { ApiProvider } from "../api-provider";
import { chains, ChainName } from "../configs";
import { Bridge } from "..";
import { PolkadotAdapter } from "./polkadot";
import { InterlayAdapter } from "./interlay";
// import { StatemintAdapter } from "./statemint";

describe.skip("interlay-adapter should work", () => {
  jest.setTimeout(30000);

  // const testAccount = "wd93QFMT7icy97uVQWjQXXEBvUH3JdDxB27JtD56yJKnJMMkF";
  const testAccount = "wd8h1Mu8rsZhiKN5zZUWuz2gtr51JajTDCtbdkzoXbMZiQAut";
  const provider = new ApiProvider("mainnet");

  async function connect(chains: ChainName[]) {
    return firstValueFrom(provider.connectFromChain(chains, undefined));
  }

  test("connect interlay to do xcm", async () => {
    // const fromChains = ["interlay", "polkadot", "statemint"] as ChainName[];
    const fromChains = ["interlay", "polkadot"] as ChainName[];

    await connect(fromChains);

    const interlay = new InterlayAdapter();
    const polkadot = new PolkadotAdapter();
    // const statemint = new StatemintAdapter();

    await interlay.setApi(provider.getApi(fromChains[0]));
    await polkadot.setApi(provider.getApi(fromChains[1]));
    // await statemint.setApi(provider.getApi(fromChains[2]));

    // const bridge = new Bridge({
    //   adapters: [interlay, polkadot, statemint],
    // });

    const bridge = new Bridge({
      adapters: [interlay, polkadot],
    });

    expect(
      bridge.router.getDestinationChains({
        from: chains.interlay,
        token: "DOT",
      }).length
    ).toEqual(1);

    // expect(
    //   bridge.router.getDestinationChains({ from: chains.interlay, token: "USDT" })
    //     .length
    // ).toEqual(1);

    const adapter = bridge.findAdapter(fromChains[0]);

    async function runMyTestSuit(to: ChainName, token: string) {
      if (adapter) {
        const balance = await firstValueFrom(
          adapter.subscribeTokenBalance(token, testAccount)
        );

        console.log(
          `balance ${token}: free-${balance.free.toNumber()} locked-${balance.locked.toNumber()} available-${balance.available.toNumber()}`
        );
        expect(balance.available.toNumber()).toBeGreaterThanOrEqual(0);
        expect(balance.free.toNumber()).toBeGreaterThanOrEqual(
          balance.available.toNumber()
        );
        expect(balance.free.toNumber()).toEqual(
          balance.locked.add(balance.available).toNumber()
        );

        const toAdapter = bridge.findAdapter(to);
        const toBalance = await firstValueFrom(
          toAdapter.subscribeTokenBalance(token, testAccount)
        );
        console.log(
          `balance at destination ${token}: free-${toBalance.free.toNumber()} locked-${toBalance.locked.toNumber()} available-${toBalance.available.toNumber()}`
        );

        const inputConfig = await firstValueFrom(
          adapter.subscribeInputConfigs({
            to,
            token,
            address: testAccount,
            signer: testAccount,
          })
        );

        console.log(
          `inputConfig: min-${inputConfig.minInput.toNumber()} max-${inputConfig.maxInput.toNumber()} ss58-${
            inputConfig.ss58Prefix
          } estimateFee-${inputConfig.estimateFee}`
        );
        expect(inputConfig.minInput.toNumber()).toBeGreaterThan(0);
        expect(inputConfig.maxInput.toNumber()).toBeLessThanOrEqual(
          balance.available.toNumber()
        );

        const destFee = adapter.getCrossChainFee(token, to);

        console.log(
          `destFee: fee-${destFee.balance.toNumber()} ${destFee.token}`
        );
        if (to != "polkadot") {
          expect(destFee.balance.toNumber()).toBeGreaterThan(0);
        } else {
          expect(destFee.balance.toNumber()).toEqual(0.1);
        }

        const tx = adapter.createTx({
          amount: FixedPointNumber.fromInner("10000000000", 10),
          to,
          token,
          address: testAccount,
          signer: testAccount,
        });

        expect(tx.method.section).toEqual("xTokens");
        // expect(tx.args.length).toEqual(4);
        // if (to === "statemint") {
        //   expect(tx.method.method).toEqual("transferMulticurrencies");
        // } else {
        //   expect(tx.method.method).toEqual("transfer");
        // }

        expect(tx.args.length).toEqual(4);
        expect(tx.method.method).toEqual("transfer");
      }
    }

    await runMyTestSuit("polkadot", "DOT");
    // await runMyTestSuit("statemint", "USDT");
  });
});
