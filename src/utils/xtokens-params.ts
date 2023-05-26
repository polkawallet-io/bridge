import { AnyApi } from "@acala-network/sdk-core";

function checkMessageVersionIsV3(api: AnyApi) {
  try {
    const keys = (api?.createType("XcmVersionedMultiLocation") as any)
      .defKeys as string[];

    return keys.includes("V3");
  } catch (e) {
    // ignore error
  }

  return false;
}

interface DestConfigs {
  useAccountKey20?: boolean;
  isToRelayChain?: boolean;
}

function createToRelayChainDestParam(isV3: boolean, accountId: string) {
  if (!isV3) {
    return {
      V1: {
        parents: 1,
        interior: { X1: { AccountId32: { id: accountId, network: "Any" } } },
      },
    };
  }

  return {
    V3: {
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
  const isV3 = checkMessageVersionIsV3(api);
  const { useAccountKey20, isToRelayChain } = configs || {};

  const accountKeyName = useAccountKey20 ? "AccountKey20" : "AccountId32";

  if (isToRelayChain) {
    return createToRelayChainDestParam(isV3, accountId);
  }

  if (!isV3) {
    return {
      V1: {
        parents: 1,
        interior: {
          X2: [
            { Parachain: paraChainId },
            {
              [accountKeyName]: {
                id: accountId,
                network: "Any",
              },
            },
          ],
        },
      },
    };
  }

  // for message version v3
  return {
    V3: {
      parents: 1,
      interior: {
        X2: [
          { Parachain: paraChainId },
          { [accountKeyName]: { id: accountId } },
        ],
      },
    },
  };
}

export function createXTokensAssetsParam(
  api: AnyApi,
  paraChainId: number,
  assetId: string,
  amount: string
) {
  const isV3 = checkMessageVersionIsV3(api);

  if (!isV3) {
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
    V3: {
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
