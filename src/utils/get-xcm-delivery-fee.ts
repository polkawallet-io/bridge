import { AnyApi, FixedPointNumber } from "@acala-network/sdk-core";
import { XcmVersionedXcm } from "@polkadot/types/lookup";
import { Codec, Observable } from "@polkadot/types/types";
import { firstValueFrom } from "rxjs";

import { ChainId, chains } from "../configs";

// refer to https://github.com/albertov19/xcmTools/blob/main/calculateKusamaDeliveryFees.ts
// delivery_fee_factor * (base_fee + encoded_msg_len * per_byte_fee)
// TODO: when most chains added xcm delivery fee, may move these to bridge package

/**
 * Only for polkadot and kusama dmp for now
 */
export async function getPolkadotXcmDeliveryFee(
  from: ChainId,
  to: ChainId,
  fromApi?: AnyApi
) {
  if (from !== "polkadot" && from !== "kusama") {
    throw new Error("from chain must be polkadot or kusama");
  }
  if (!fromApi) return FixedPointNumber.ZERO;
  const decimal = fromApi?.registry.chainDecimals[0];
  const paraID = chains[to].paraChainId;

  // https://github.com/polkadot-fellows/runtimes/blob/16635f6abda9c5fe4b62231d632ab6f6695b48f7/system-parachains/constants/src/polkadot.rs#L60C29-L60C43
  // https://github.com/polkadot-fellows/runtimes/blob/16635f6abda9c5fe4b62231d632ab6f6695b48f7/system-parachains/constants/src/kusama.rs#L38
  const UNITS =
    from === "polkadot" ? BigInt(10000000000) : BigInt(1000000000000);
  const QUID = UNITS / BigInt(30);
  const CENTS = QUID / BigInt(100);
  // const GRAND = QUID / BigInt(1000);
  const MILLICENTS = CENTS / BigInt(1000);

  const byteFee = BigInt(10) * MILLICENTS;
  const baseDeliveryFee = BigInt(3) * CENTS;

  const exampleXcm: XcmVersionedXcm = fromApi?.createType(
    "XcmVersionedXcm",
    exampleXcmMessage
  ) as any;
  const xcmBytes = exampleXcm.toU8a();

  const deliveryFeeFactor: Codec = await (fromApi?.type === "rxjs"
    ? firstValueFrom(
        fromApi?.query.dmp.deliveryFeeFactor(
          BigInt(paraID)
        ) as Observable<Codec>
      )
    : (fromApi?.query.dmp.deliveryFeeFactor(BigInt(paraID)) as Promise<Codec>));

  const convDeliveryFeeFactor =
    BigInt(deliveryFeeFactor.toString()) / BigInt(10 ** 18);

  const fee =
    convDeliveryFeeFactor *
    (baseDeliveryFee + BigInt(xcmBytes.length) * byteFee);

  return FixedPointNumber.fromInner(fee.toString(), decimal).mul(
    new FixedPointNumber(1.2) // add some buffer
  );
}

const exampleXcmMessage = {
  V3: [
    {
      WithdrawAsset: [
        {
          assets: [
            {
              ConcreteFungible: {
                id: "Here",
                amount: "20000000000000",
              },
            },
          ],
          effects: [
            {
              BuyExecution: {
                fees: "0",
                weight_limit: {
                  Unlimited: null,
                },
              },
            },
            {
              DepositAsset: {
                assets: "All",
                dest: {
                  X1: {
                    Parachain: "2000",
                  },
                },
              },
            },
            {
              DepositReserveAsset: {
                assets: "All",
                dest: {
                  X1: {
                    AccountId32: {
                      network: "Any",
                      id: "0x76c7e05b8ee00557f8f7e11f283aacd3bbee59c1d9fd588ebbe1b6c435fe504c",
                    },
                  },
                },
                effects: [],
              },
            },
          ],
        },
      ],
    },
  ],
};
