import { firstValueFrom } from "rxjs";

import { ApiProvider } from "../api-provider";
import { ChainId } from "../configs";
import { Bridge } from "../bridge";
import { TuringAdapter } from "./oak";

describe.skip("oak-adapter should work", () => {
  jest.setTimeout(30000);

  const testAccount = "5GREeQcGHt7na341Py6Y6Grr38KUYRvVoiFSiDB52Gt7VZiN";
  const provider = new ApiProvider();

  async function connect(chain: ChainId) {
    return firstValueFrom(provider.connectFromChain([chain], undefined));
  }

  test("connect turing to do xcm", async () => {
    const fromChain = "turing";

    await connect(fromChain);

    const turing = new TuringAdapter();

    await turing.init(provider.getApi(fromChain));

    const bridge = new Bridge({
      adapters: [turing],
    });

    // expect(bridge.router.getDestinationChains({ from: chains.karura, token: 'KSM' }).length).toEqual(1);

    const adapter = bridge.findAdapter(fromChain);

    async function runMyTestSuit(to: ChainId, token: string) {
      if (adapter) {
        const balance = await firstValueFrom(adapter.subscribeTokenBalance(token, testAccount));

        console.log(
          `balance ${token}: free-${balance.free.toNumber()} locked-${balance.locked.toNumber()} available-${balance.available.toNumber()}`
        );
        expect(balance.available.toNumber()).toBeGreaterThanOrEqual(0);
        // expect(balance.free.toNumber()).toBeGreaterThanOrEqual(balance.available.toNumber());
        // expect(balance.free.toNumber()).toEqual(balance.locked.add(balance.available).toNumber());

        // const inputConfig = await firstValueFrom(adapter.subscribeInputConfigs({ to, token, address: testAccount, signer: testAccount }));

        // console.log(
        //   `inputConfig: min-${inputConfig.minInput.toNumber()} max-${inputConfig.maxInput.toNumber()} ss58-${inputConfig.ss58Prefix}`
        // );
        // expect(inputConfig.minInput.toNumber()).toBeGreaterThan(0);
        // expect(inputConfig.maxInput.toNumber()).toBeLessThanOrEqual(balance.available.toNumber());

        // const destFee = adapter.getCrossChainFee(token, to);

        // console.log(`destFee: fee-${destFee.balance.toNumber()} ${destFee.token}`);
        // expect(destFee.balance.toNumber()).toBeGreaterThan(0);

        // const tx = adapter.createTx({
        //   amount: FixedPointNumber.fromInner('10000000000', 10),
        //   to,
        //   token,
        //   address: testAccount,
        //   signer: testAccount
        // });

        // if (to !== 'statemine') {
        //   expect(tx.method.section).toEqual('xTokens');
        //   expect(tx.method.method).toEqual('transfer');
        //   expect(tx.args.length).toEqual(4);
        // }
      }
    }

    // await runMyTestSuit('karura', 'SDN');
    await runMyTestSuit("turing", "LKSM");
  });
});
