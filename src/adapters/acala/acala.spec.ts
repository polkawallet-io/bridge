import { FixedPointNumber } from "@acala-network/sdk-core";
import { firstValueFrom } from "rxjs";

import { ApiProvider } from "../../api-provider";
import { ChainId } from "../../configs";
import { Bridge } from "../../bridge";
import { KaruraAdapter } from "./acala";
import { KusamaAdapter } from "../polkadot";
import { MoonriverAdapter } from "../moonbeam";
import { StatemineAdapter } from "../statemint";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";

describe("acala-adapter", () => {
  jest.setTimeout(50000);

  let bridge: Bridge;
  const address = "5GREeQcGHt7na341Py6Y6Grr38KUYRvVoiFSiDB52Gt7VZiN";
  // the addressId is the address above in hex format
  const addressId = '0xc0997c4f2b3a83eb07ef74a867cf672a25a2a30cc61abc936dcc994df77ba84a'
  const moonbeamReceive = "0x46DBcbDe55be6cc4ce0C72C8d48BF61eb19D6be0";

  const validateTx = (
    tx: SubmittableExtrinsic<'rxjs', ISubmittableResult>,
    token: any,
    amount: string,
    destination: any,
  ) => {
    expect(tx.method.method).toEqual('transfer');
    expect(tx.method.section).toEqual('xTokens');
    expect(tx.args[0].toHuman()).toEqual(token);
    expect(tx.args[1].toString()).toEqual(amount);
    expect(tx.args[2].toHuman()).toEqual(destination);
  }


  beforeAll(async () => {
    const provider = new ApiProvider();
    const karura = new KaruraAdapter();
    const kusama = new KusamaAdapter();
    const moonriver = new MoonriverAdapter();
    const statemine = new StatemineAdapter();

    await firstValueFrom(provider.connectFromChain(['karura', 'kusama', 'statemine'] as ChainId[]));

    await karura.init(provider.getApi('karura'));
    await kusama.init(provider.getApi('kusama'));
    await statemine.init(provider.getApi('statemine'));

    bridge = new Bridge({
      adapters: [karura, kusama, moonriver, statemine],
    });
  });

  afterAll(() => {
    bridge.adapters.forEach((i) => {
      const api = i.getApi();

      if (api) {
        api.disconnect();
      }
    });
  });

  test('bridge sdk init should work', (done) => {
    expect(bridge).toBeDefined();

    done();
  });

  test('transfer from karura to kusama should be ok', (done) => {
    const adapter = bridge.findAdapter('karura');

    expect(adapter).toBeDefined();

    const kusama = adapter.getToken('KSM');
    const api = adapter.getApi();
    const amount = new FixedPointNumber(1, kusama.decimals);
    const tx = adapter.createTx({
      to: 'kusama',
      token: 'KSM',
      amount,
      address
    });

    // DONT MODIFY THIS, THE OBJECT IS VALID, UNLESS YOU KNOW WHAT YOU ARE DOING
    const location = api.createType('XcmVersionedMultiLocation', {
      V3: {
        parents: '1',
        interior: { X1: { AccountId32: { id: addressId, network: null }} }
      }
    });

    validateTx(
      tx as SubmittableExtrinsic<'rxjs', ISubmittableResult>,
      { Token: 'KSM'},
      amount.toChainData(),
      location.toHuman()
    );

    console.log(JSON.stringify(tx.args[2].toHuman()));

    done();
  });

  test('tranfser from karura to moonbeam should be ok', (done) => {
    const adapter = bridge.findAdapter('karura');

    expect(adapter).toBeDefined();
    const movr = adapter.getToken('MOVR');
    const api = adapter.getApi();
    const amount = new FixedPointNumber(1, movr.decimals);
    const tx = adapter.createTx({
      to: 'moonriver',
      token: 'MOVR',
      amount,
      address: moonbeamReceive
    });

    // DONT MODIFY THIS, THE OBJECT IS VALID, UNLESS YOU KNOW WHAT YOU ARE DOING
    const location = api.createType('XcmVersionedMultiLocation', {
      V3: {
        parents: "1",
        interior: {
          X2: [
            { Parachain: "2023" },
            { AccountKey20: { key: moonbeamReceive }}
          ]
        }
      }
    })

    validateTx(
      tx as SubmittableExtrinsic<'rxjs', ISubmittableResult>,
      { ForeignAsset: "3" },
      amount.toChainData(),
      location.toHuman()
    );

    done();
  });

  test('transfer from karura to statemine should be ok', (done) => {
    const adapter = bridge.findAdapter('karura');

    expect(adapter).toBeDefined();

    const rmrk = adapter.getToken('RMRK');
    const api = adapter.getApi();
    const amount = new FixedPointNumber(1, rmrk.decimals);
    const tx = adapter.createTx({
      to: 'statemine',
      token: 'RMRK',
      amount,
      address
    });

    // DONT MODIFY THIS, THE OBJECT IS VALID, UNLESS YOU KNOW WHAT YOU ARE DOING
    const location = api.createType('XcmVersionedMultiLocation', {
      V3: {
        parents: "1",
        interior: {
          X2: [
            { Parachain: "1000" },
            { AccountId32: { id: addressId } }
          ]
        }
      }
    });

    // DONT MODIFY THIS, THE OBJECT IS VALID, UNLESS YOU KNOW WHAT YOU ARE DOING
    const assets = api.createType('XcmVersionedMultiAsset', {
      V3: {
        fun: {
          Fungible: amount.toChainData(),
        },
        id: {
          Concrete: {
            parents: 1,
            interior: {
              X3: [
                { Parachain: "1000" },
                { PalletInstance: 50 },
                { GeneralIndex: 8 }
              ]
            }
          }
        }
      }
    })

    expect(tx.method.method).toEqual('transferMultiasset');
    expect(tx.method.section).toEqual('xTokens');
    expect(tx.args[0].toHuman()).toEqual(assets.toHuman());
    expect(tx.args[1].toHuman()).toEqual(location.toHuman());

    done();
  });
});
