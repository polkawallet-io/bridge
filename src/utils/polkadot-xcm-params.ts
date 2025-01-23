import { AnyApi } from "@acala-network/sdk-core";
import { checkMessageVersion } from "./check-message-version";

export type XCMType = "V0" | "V1" | "V2" | "V3" | "V4";

export function createPolkadotXCMDest(
  api: AnyApi,
  parachainId: number,
  parents = 1,
  targetVersion: XCMType | undefined = undefined
): any {
  const version = targetVersion ?? checkMessageVersion(api);

  if (version === "V4") {
    return {
      V4: {
        parents,
        interior: { X1: [{ Parachain: parachainId }] },
      },
    };
  }

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
  accountType = "AccountId32",
  targetVersion: XCMType | undefined = undefined
): any {
  const version = targetVersion ?? checkMessageVersion(api);

  if (version === "V4") {
    return {
      V4: {
        parents: 0,
        interior: {
          X1: [
            {
              [accountType]: {
                [accountType === "AccountId32" ? "id" : "key"]: accountId,
                network: undefined,
              },
            },
          ],
        },
      },
    };
  }

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
  position: "NATIVE" | any[],
  targetVersion: XCMType | undefined = undefined
): any {
  const version = targetVersion ?? checkMessageVersion(api);
  let tokenPosition: any =
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

  if (version === "V4") {
    tokenPosition =
      position === "NATIVE"
        ? {
            id: {
              parents: 0,
              interior: "Here",
            },
          }
        : {
            id: {
              paraents: 1,
              interior: {
                X2: position,
              },
            },
          };
  }

  return {
    [version]: [
      {
        ...tokenPosition,
        fun: { Fungible: amount },
      },
    ],
  };
}
