import { AnyApi } from "@acala-network/sdk-core";
import { XCMVersion, checkMessageVersion } from "./check-message-version";

interface DestConfigs {
  useAccountKey20?: boolean;
  isToRelayChain?: boolean;
}

function createToRelayChainDestParam(version: XCMVersion, accountId: string) {
  if (version === "V1") {
    return {
      V1: {
        parents: 1,
        interior: { X1: { AccountId32: { id: accountId, network: "Any" } } },
      },
    };
  }

  if (version === "V4") {
    return {
      [version]: {
        parents: 1,
        interior: { X1: [{ AccountId32: { id: accountId } }] },
      },
    };
  }

  return {
    [version]: {
      parents: 1,
      interior: { X1: { AccountId32: { id: accountId } } },
    },
  };
}

export function createXTokensDestParam(
  api: AnyApi,
  paraChainId: number,
  accountId: string,
  configs?: DestConfigs
) {
  const version = checkMessageVersion(api);
  const { useAccountKey20, isToRelayChain } = configs || {};

  const accountKeyName = useAccountKey20 ? "AccountKey20" : "AccountId32";

  if (isToRelayChain) {
    return createToRelayChainDestParam(version, accountId);
  }

  if (version === "V1") {
    return {
      V1: {
        parents: 1,
        interior: {
          X2: [
            { Parachain: paraChainId },
            {
              [accountKeyName]: {
                [useAccountKey20 ? "key" : "id"]: accountId,
                network: "Any",
              },
            },
          ],
        },
      },
    };
  }

  // for message version v3 & v4
  return {
    [version]: {
      parents: 1,
      interior: {
        X2: [
          { Parachain: paraChainId },
          {
            [accountKeyName]: {
              [useAccountKey20 ? "key" : "id"]: accountId,
            },
          },
        ],
      },
    },
  };
}

export function createXTokensAssetsParam(
  api: AnyApi,
  paraChainId: number,
  assetId: any,
  amount: string
) {
  const version = checkMessageVersion(api);

  if (version === "V1") {
    return {
      V1: {
        fun: {
          Fungible: amount,
        },
        id: {
          Concrete: {
            parents: 1,
            interior: {
              X3: [
                { Parachain: paraChainId },
                { PalletInstance: 50 },
                { GeneralIndex: assetId },
              ],
            },
          },
        },
      },
    };
  }

  return {
    [version]: {
      fun: {
        Fungible: amount,
      },
      id: {
        Concrete: {
          parents: 1,
          interior: {
            X3: [
              { Parachain: paraChainId },
              { PalletInstance: 50 },
              { GeneralIndex: assetId },
            ],
          },
        },
      },
    },
  };
}

export function createXTokensWeight(api: AnyApi, weight: string) {
  const tx = api.tx.xTokens?.transfer || api.tx.ormlXTokens?.transfer;

  if (!tx) throw new Error("xTokens.transfer tx is not found");

  const weightType = tx.meta.args[3].type.toString();
  const isUnlimited =
    weightType === "XcmV3WeightLimit" || weightType === "XcmV2WeightLimit";

  return isUnlimited ? "Unlimited" : weight;
}
