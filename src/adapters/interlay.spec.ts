import { firstValueFrom } from "rxjs";

import { ApiProvider } from "../api-provider";
import { chains, ChainName } from "../configs";
import { Bridge } from "..";
import { PolkadotAdapter } from "./polkadot";
import { InterlayAdapter, KintsugiAdapter } from "./interlay";
import { StatemintAdapter } from "./statemint";
import { AcalaAdapter, KaruraAdapter } from "./acala";
import { HeikoAdapter } from "./parallel";
import { buildTestTxWithConfigData } from "../utils/shared-spec-methods";
import { BifrostAdapter } from "./bifrost";

// helper method for getting balances, configs, fees, and constructing xcm extrinsics
async function runMyTestSuite(testAccount: string, bridge: Bridge, from: ChainName, to: ChainName, token: string) {
  const {fromBalance, toBalance, inputConfig, destFee, tx} = await buildTestTxWithConfigData(testAccount, bridge, from, to, token);

  // from balance prints/checks
  console.log(
    `balance ${token}: free-${fromBalance.free.toNumber()} locked-${fromBalance.locked.toNumber()} available-${fromBalance.available.toNumber()}`
  );
  expect(fromBalance.available.toNumber()).toBeGreaterThanOrEqual(0);
  expect(fromBalance.free.toNumber()).toBeGreaterThanOrEqual(
    fromBalance.available.toNumber()
  );
  expect(fromBalance.free.toNumber()).toEqual(
    fromBalance.locked.add(fromBalance.available).toNumber()
  );
  
  // toBalance prints/checks
  console.log(
    `balance at destination ${token}: free-${toBalance.free.toNumber()} locked-${toBalance.locked.toNumber()} available-${toBalance.available.toNumber()}`
  );

  // inputConfig prints/checks
  console.log(
    `inputConfig: min-${inputConfig.minInput.toNumber()} max-${inputConfig.maxInput.toNumber()} ss58-${
      inputConfig.ss58Prefix
    } estimateFee-${inputConfig.estimateFee}`
  );
  expect(inputConfig.minInput.toNumber()).toBeGreaterThan(0);
  expect(inputConfig.maxInput.toNumber()).toBeLessThanOrEqual(
    fromBalance.available.toNumber()
  );

  // destFee prints/checks
  console.log(
    `destFee: fee-${destFee.balance.toNumber()} ${destFee.token}`
  );
  if (to === "polkadot") {
    expect(destFee.balance.toNumber()).toEqual(0.1);
  } else {
    expect(destFee.balance.toNumber()).toBeGreaterThan(0);
  }

  // tx method & params checks
  expect(tx.method.section).toEqual("xTokens");
  expect(tx.args.length).toEqual(4);
  expect(tx.method.method).toEqual("transfer");
};

describe.skip("interlay-adapter should work", () => {
  jest.setTimeout(30000);

  const testAccount = "wd8h1Mu8rsZhiKN5zZUWuz2gtr51JajTDCtbdkzoXbMZiQAut";
  const provider = new ApiProvider();

  async function connect(chains: ChainName[]) {
    return firstValueFrom(provider.connectFromChain(chains, undefined));
  }

  test("connect kintsugi to do xcm", async () => {
    const fromChains = ["kintsugi", "karura", "heiko", "bifrost"] as ChainName[];

    await connect(fromChains);

    const kintsugi = new KintsugiAdapter();
    const karura = new KaruraAdapter();
    const heiko = new HeikoAdapter();
    const bifrost = new BifrostAdapter();

    await kintsugi.setApi(provider.getApi(fromChains[0]));
    await karura.setApi(provider.getApi(fromChains[1]));
    await heiko.setApi(provider.getApi(fromChains[2]));
    await bifrost.setApi(provider.getApi(fromChains[3]));

    const bridge = new Bridge({
      adapters: [kintsugi, karura, heiko, bifrost],
    });

    // expected destinations: 1 (heiko, karura)
    expect(
      bridge.router.getDestinationChains({
        from: chains.kintsugi,
        token: "KINT",
      }).length
    ).toEqual(2);

    // expected destinations: 2 (heiko and karura)
    expect(
      bridge.router.getDestinationChains({
        from: chains.kintsugi,
        token: "KBTC",
      }).length
    ).toEqual(2);

    expect(
      bridge.router.getDestinationChains({
        from: chains.kintsugi,
        token: "LKSM",
      }).length
    ).toEqual(1);

    expect(
      bridge.router.getDestinationChains({
        from: chains.kintsugi,
        token: "VKSM",
      }).length
    ).toEqual(1);

    
    await runMyTestSuite(testAccount, bridge, "kintsugi", "heiko", "KBTC");
    await runMyTestSuite(testAccount, bridge, "kintsugi", "karura", "KINT");
    await runMyTestSuite(testAccount, bridge, "kintsugi", "karura", "KBTC");
    await runMyTestSuite(testAccount, bridge, "kintsugi", "karura", "LKSM");
    await runMyTestSuite(testAccount, bridge, "kintsugi", "bifrost", "VKSM");
  });

  test("connect interlay to do xcm", async () => {
    const fromChains = ["interlay", "polkadot", "statemint", "acala"] as ChainName[];

    await connect(fromChains);

    const interlay = new InterlayAdapter();
    const polkadot = new PolkadotAdapter();
    const statemint = new StatemintAdapter();
    const acala = new AcalaAdapter();

    await interlay.setApi(provider.getApi(fromChains[0]));
    await polkadot.setApi(provider.getApi(fromChains[1]));
    await statemint.setApi(provider.getApi(fromChains[2]));
    await acala.setApi(provider.getApi(fromChains[3]));

    const bridge = new Bridge({
      adapters: [interlay, polkadot, statemint, acala],
    });

    expect(
      bridge.router.getDestinationChains({
        from: chains.interlay,
        token: "DOT",
      }).length
    ).toEqual(1);

    expect(
      bridge.router.getDestinationChains({
        from: chains.interlay,
        token: "USDT",
      }).length
    ).toEqual(1);

    expect(
      bridge.router.getDestinationChains({
        from: chains.interlay,
        token: "IBTC",
      }).length
    ).toEqual(1);

    expect(
      bridge.router.getDestinationChains({
        from: chains.interlay,
        token: "INTR",
      }).length
    ).toEqual(1);

    await runMyTestSuite(testAccount, bridge, "interlay", "polkadot", "DOT");
    await runMyTestSuite(testAccount, bridge, "interlay", "statemint", "USDT");
    await runMyTestSuite(testAccount, bridge, "interlay", "acala", "IBTC");
    await runMyTestSuite(testAccount, bridge, "interlay", "acala", "INTR");
  });
});
