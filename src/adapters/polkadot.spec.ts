import { FixedPointNumber } from '@acala-network/sdk-core';
import { firstValueFrom } from 'rxjs';

import { ApiProvider } from '../api-provider';
import { chains, ChainId } from '../configs';
import { Bridge } from '../bridge';
import { KusamaAdapter } from './polkadot';

describe.skip('polkadot-adapter should work', () => {
  jest.setTimeout(30000);

  const testAccount = '5GREeQcGHt7na341Py6Y6Grr38KUYRvVoiFSiDB52Gt7VZiN';
  const provider = new ApiProvider();

  async function connect (chain: ChainId) {
    return firstValueFrom(provider.connectFromChain([chain], undefined));
  }

  test('connect kusama to do xcm', async () => {
    const fromChain = 'kusama';

    await connect(fromChain);

    const kusama = new KusamaAdapter();

    await kusama.init(provider.getApi(fromChain));

    const bridge = new Bridge({
      adapters: [kusama]
    });

    expect(bridge.router.getDestinationChains({ from: chains.kusama, token: 'KSM' }).length).toEqual(1);

    const kusamaAdapter = bridge.findAdapter(fromChain);

    if (kusamaAdapter) {
      const balance = await firstValueFrom(kusamaAdapter.subscribeTokenBalance('KSM', testAccount));

      console.log(`balance: free-${balance.free.toNumber()} locked-${balance.locked.toNumber()} available-${balance.available.toNumber()}`);
      expect(balance.available.toNumber()).toBeGreaterThanOrEqual(0);
      expect(balance.free.toNumber()).toBeGreaterThanOrEqual(balance.available.toNumber());
      expect(balance.free.toNumber()).toEqual(balance.locked.add(balance.available).toNumber());

      const inputConfig = await firstValueFrom(kusamaAdapter.subscribeInputConfig({ to: 'karura', token: 'KSM', address: testAccount, signer: testAccount }));

      console.log(
        `inputConfig: min-${inputConfig.minInput.toNumber()} max-${inputConfig.maxInput.toNumber()} ss58-${inputConfig.ss58Prefix}`
      );
      expect(inputConfig.minInput.toNumber()).toBeGreaterThan(0);
      expect(inputConfig.maxInput.toNumber()).toBeLessThanOrEqual(balance.available.toNumber());

      const destFee = kusamaAdapter.getCrossChainFee('KSM', 'karura');

      console.log(`destFee: ${destFee.balance.toNumber()} ${destFee.token}`);
      expect(destFee.balance.toNumber()).toBeGreaterThan(0);

      const tx = kusamaAdapter.createTx({
        amount: FixedPointNumber.fromInner('10000000000', 10),
        to: 'karura',
        token: 'KSM',
        address: testAccount,
        signer: testAccount
      });

      expect(tx.method.section).toEqual('xcmPallet');
      expect(tx.method.method).toEqual('reserveTransferAssets');
      expect(tx.args.length).toEqual(4);
    }
  });
});
