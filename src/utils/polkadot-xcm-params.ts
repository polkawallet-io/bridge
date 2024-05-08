import { AnyApi } from "@acala-network/sdk-core";
import { checkMessageVersion } from "./check-message-version";

export function createPolkadotXCMDest(
  api: AnyApi,
  parachainId: number,
  parents = 1
): any {
  const version = checkMessageVersion(api);

  return {
    [version]: {
      parents,
      interior: { X1: { Parachain: parachainId } },
    },
  };
}

export function createPolkadotXCMAccount(
  api: AnyApi,
  accountId: string,
  accountType = "AccountId32"
): any {
  const version = checkMessageVersion(api);

  return {
    [version]: {
      parents: 0,
      interior: {
        X1: {
          [accountType]: {
            [accountType === "AccountId32" ? "id" : "key"]: accountId,
            network: version === "V1" ? "Any" : undefined,
          },
        },
      },
    },
  };
}

export function createPolkadotXCMAsset(
  api: AnyApi,
  amount: string,
  position: "NATIVE" | any[]
): any {
  const version = checkMessageVersion(api);
  const tokenPosition =
    position === "NATIVE"
      ? {
          id: { Concrete: { parents: 0, interior: "Here" } },
        }
      : {
          id: {
            Concrete: {
              parents: 1,
              interior: {
                X2: position,
              },
            },
          },
        };

  return {
    [version]: [
      {
        ...tokenPosition,
        fun: { Fungible: amount },
      },
    ],
  };
}
