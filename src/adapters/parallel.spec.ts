import { firstValueFrom } from "rxjs";

import { ApiProvider } from "../api-provider";
import { chains, ChainName } from "../configs";
import { Bridge } from "..";
import { KintsugiAdapter } from "./interlay";
import { HeikoAdapter } from "./parallel";
import { buildTestTxWithConfigData } from "../utils/shared-spec-methods";

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
  expect(destFee.balance.toNumber()).toBeGreaterThan(0);

  // tx method & params checks
  expect(tx.method.section).toEqual("xTokens");
  expect(tx.args.length).toEqual(4);
  expect(tx.method.method).toEqual("transfer");
};

describe.skip("parallel-adapter should work", () => {
  jest.setTimeout(30000);

  // alice
  const testAccount = "hJKzPoi3MQnSLvbShxeDmzbtHncrMXe5zwS3Wa36P6kXeNpcv";
  const provider = new ApiProvider();

  async function connect(chains: ChainName[]) {
    return firstValueFrom(provider.connectFromChain(chains, undefined));
  }

  test("connect parallel-heiko to do xcm", async () => {
    const fromChains = ["heiko", "kintsugi"] as ChainName[];

    await connect(fromChains);

    const heiko = new HeikoAdapter();
    const kintsugi = new KintsugiAdapter();

    await heiko.setApi(provider.getApi(fromChains[0]));
    await kintsugi.setApi(provider.getApi(fromChains[1]));

    const bridge = new Bridge({
      adapters: [heiko, kintsugi],
    });

    expect(
      bridge.router.getDestinationChains({
        from: chains.heiko,
        token: "KBTC",
      }).length
    ).toEqual(1);

    await runMyTestSuite(testAccount, bridge, "heiko", "kintsugi", "KBTC");
  });

  // in preparation for later addition of parallel <-> interlay XCM
  // test("connect parallel to do xcm", async () => {
  //   const fromChains = ["parallel", "interlay"] as ChainName[];

  //   await connect(fromChains);

  //   const parallel = new ParallelAdapter();
  //   const interlay = new InterlayAdapter();

  //   await parallel.setApi(provider.getApi(fromChains[0]));
  //   await interlay.setApi(provider.getApi(fromChains[1]));

  //   const bridge = new Bridge({
  //     adapters: [parallel, interlay],
  //   });

  //   expect(
  //     bridge.router.getDestinationChains({
  //       from: chains.interlay,
  //       token: "IBTC",
  //     }).length
  //   ).toEqual(1);

  //   await runMyTestSuite(testAccount, bridge, "parallel", "interlay", "IBTC");
  // });
});
