import { AnyApi } from "@acala-network/sdk-core";
import { checkMessageVersionIsV3 } from "./check-message-version";

export function createPolkadotXCMDest(
  api: AnyApi,
  parachainId: number,
  parents = 1
) {
  const isV3 = checkMessageVersionIsV3(api);
  const versionTag = isV3 ? "V3" : "V1";

  return {
    [versionTag]: {
      parents,
      interior: { X1: { Parachain: parachainId } },
    },
  };
}

export function createPolkadotXCMAccount(api: AnyApi, accountId: string) {
  const isV3 = checkMessageVersionIsV3(api);
  const versionTag = isV3 ? "V3" : "V1";

  return {
    [versionTag]: {
      parents: 0,
      interior: {
        X1: {
          AccountId32: { id: accountId, network: isV3 ? undefined : "Any" },
        },
      },
    },
  };
}

export function createPolkadotXCMAsset(
  api: AnyApi,
  amount: string,
  token:
    | "NATIVE"
    | {
        paraChainId: number;
        tokenId?: string;
      }
) {
  const isV3 = checkMessageVersionIsV3(api);
  const tokenPosition =
    token === "NATIVE"
      ? {
          id: { Concrate: { parents: 0, interior: "Here" } },
        }
      : {
          id: {
            Concrete: {
              parents: 1,
              interior: {
                X2: [
                  { Parachain: token.paraChainId },
                  { GeneralKey: token.tokenId },
                ],
              },
            },
          },
        };
  const versionTag = isV3 ? "V3" : "V1";

  return {
    [versionTag]: [
      {
        ...tokenPosition,
        fun: { Fungible: amount },
      },
    ],
  };
}
