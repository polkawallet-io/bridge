import { AnyApi, FixedPointNumber } from "@acala-network/sdk-core";
import { Chain } from "../types";
import { isChainEqual } from "./is-chain-equal";
import { supportsV0V1Multilocation } from "./xcm-versioned-multilocation-check";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { DestinationWeightNotFound } from "../errors";

const buildV1orV3Destination = (
  api: AnyApi,
  accountId: `0x${string}`,
  toChain: Chain
): any => {
  const supportsV1 = supportsV0V1Multilocation(api);
  const isToRelayChain =
    isChainEqual(toChain, "kusama") || isChainEqual(toChain, "polkadot");

  const accountIdPart = supportsV1
    ? { AccountId32: { id: accountId, network: "Any" } }
    : { AccountId32: { id: accountId } };

  const interiorPart = isToRelayChain
    ? { interior: { X1: accountIdPart } }
    : {
        interior: {
          X2: [{ Parachain: toChain.paraChainId }, accountIdPart],
        },
      };

  const destPart = {
    parents: 1,
    ...interiorPart,
  };

  return supportsV1 ? { V1: destPart } : { V3: destPart };
};

const supportsUnlimitedDestWeight = (api: AnyApi): boolean =>
  api.tx.xTokens.transfer.meta.args[3].type.toString() === "XcmV2WeightLimit" ||
  api.tx.xTokens.transfer.meta.args[3].type.toString() === "XcmV3WeightLimit";

export const xTokensHelper = {
  transfer: (
    api: AnyApi,
    fromChain: Chain,
    toChain: Chain,
    accountId: `0x${string}`,
    tokenName: string,
    tokenId: any,
    amount: FixedPointNumber,
    configuredDestWeight: string | undefined
  ):
    | SubmittableExtrinsic<"promise", ISubmittableResult>
    | SubmittableExtrinsic<"rxjs", ISubmittableResult> => {
    const dst = buildV1orV3Destination(api, accountId, toChain);

    const destWeight = supportsUnlimitedDestWeight(api)
      ? "Unlimited"
      : configuredDestWeight;

    if (destWeight === undefined) {
      throw new DestinationWeightNotFound(fromChain.id, toChain.id, tokenName);
    }

    return api.tx.xTokens.transfer(
      tokenId,
      amount.toChainData(),
      dst,
      destWeight
    );
  },
};
