import { FixedPointNumber } from "@acala-network/sdk-core";
import { firstValueFrom } from "rxjs";
import { Bridge } from "src";
import { ChainName } from "src/configs";

// test helper method for getting balances, configs, fees, and constructing xcm extrinsics
export async function buildTestTxWithConfigData(
  testAccount: string,
  bridge: Bridge,
  from: ChainName,
  to: ChainName,
  token: string
) {
  const fromAdapter = bridge.findAdapter(from);
  if (!fromAdapter) {
    throw Error(`Unable to find fromAdapter [${fromAdapter}] in bridge`);
  }
  const toAdapter = bridge.findAdapter(to);
  if (!toAdapter) {
    throw Error(`Unable to find toAdapter [${toAdapter}] in bridge`);
  }

  const [fromBalance, toBalance, inputConfig] = await Promise.all([
    firstValueFrom(fromAdapter.subscribeTokenBalance(token, testAccount)),
    firstValueFrom(toAdapter.subscribeTokenBalance(token, testAccount)),
    firstValueFrom(
      fromAdapter.subscribeInputConfigs({
        to,
        token,
        address: testAccount,
        signer: testAccount,
      })
    ),
  ]);

  const destFee = fromAdapter.getCrossChainFee(token, to);

  const tx = fromAdapter.createTx({
    amount: FixedPointNumber.fromInner("10000000000", 10),
    to,
    token,
    address: testAccount,
    signer: testAccount,
  });

  return { fromBalance, toBalance, inputConfig, destFee, tx };
}
