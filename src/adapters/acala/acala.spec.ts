import { FixedPointNumber } from "@acala-network/sdk-core";
import { Bridge } from "../../bridge";
import { KaruraAdapter } from "./acala";
import { KusamaAdapter } from "../polkadot";
import { MoonriverAdapter } from "../moonbeam";
import { AssetHubKusamaAdapter } from "../assethub";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { ApiPromise, WsProvider } from "@polkadot/api";

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
    const karura = new KaruraAdapter();
    const kusama = new KusamaAdapter();
    const moonriver = new MoonriverAdapter();
    const assetHubKusama = new AssetHubKusamaAdapter();

    const karuraApi = new ApiPromise({ provider: new WsProvider('wss://karura-rpc-1.aca-api.network') });
    const kusmaApi = new ApiPromise({ provider: new WsProvider('wss://kusama-public-rpc.blockops.network/ws') });
    const assetHubApi = new ApiPromise({ provider: new WsProvider('wss://statemine-rpc.dwellir.com') });

    await karura.init(karuraApi);
    await kusama.init(kusmaApi);
    await assetHubKusama.init(assetHubApi);

    bridge = new Bridge({
      adapters: [karura, kusama, moonriver, assetHubKusama],
    });
  });

  afterAll(async () => {
    for (const adapter of bridge.adapters) {
      const api = adapter.getApi();

      if (api) {
        await api?.disconnect();
      }
    }
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

    // just for type check
    if (!api) return;

    const amount = new FixedPointNumber(1, kusama.decimals);
    const tx = adapter.createTx({
      to: 'kusama',
      token: 'KSM',
      amount,
      address
    });

    // DONT MODIFY THIS, THE OBJECT IS VALID, UNLESS YOU KNOW WHAT YOU ARE DOING
    const location = api.createType('XcmVersionedLocation', {
      V4: {
        parents: '1',
        interior: { X1: [{ AccountId32: { id: addressId, network: null } }] }
      }
    });

    validateTx(
      tx as SubmittableExtrinsic<'rxjs', ISubmittableResult>,
      { Token: 'KSM' },
      amount.toChainData(),
      location.toHuman()
    );

    done();
  });

  test('tranfser from karura to moonbeam should be ok', (done) => {
    try {
      const adapter = bridge.findAdapter('karura');

      expect(adapter).toBeDefined();
      const movr = adapter.getToken('MOVR');
      const api = adapter.getApi();

      // just for type check
      if (!api) return;

      const amount = new FixedPointNumber(1, movr.decimals);
      const tx = adapter.createTx({
        to: 'moonriver',
        token: 'MOVR',
        amount,
        address: moonbeamReceive
      });

      // DONT MODIFY THIS, THE OBJECT IS VALID, UNLESS YOU KNOW WHAT YOU ARE DOING
      const location = api.createType('XcmVersionedLocation', {
        V3: {
          parents: "1",
          interior: {
            X2: [
              { Parachain: "2023" },
              { AccountKey20: { key: moonbeamReceive } }
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

    } catch (e) {
      // ignore error
    }
  });

  test('transfer from karura to asset hub should be ok', (done) => {
    try {

      const adapter = bridge.findAdapter('karura');

      expect(adapter).toBeDefined();

      const rmrk = adapter.getToken('RMRK');
      const api = adapter.getApi();

      // just for type check
      if (!api) return;

      const amount = new FixedPointNumber(1, rmrk.decimals);
      const tx = adapter.createTx({
        to: 'assetHubKusama',
        token: 'RMRK',
        amount,
        address
      });

      // DONT MODIFY THIS, THE OBJECT IS VALID, UNLESS YOU KNOW WHAT YOU ARE DOING
      const location = api.createType('XcmVersionedLocation', {
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
      const assets = api.createType('XcmVersionedAsset', {
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
    } catch (e) {
      // ignore error
    }
  });
});
