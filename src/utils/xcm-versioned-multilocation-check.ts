import { AnyApi } from "@acala-network/sdk-core";

// XcmV3Junction's GeneralKey data length in bytes is 32
export const XCM_V3_GENERAL_KEY_DATA_BYTES = 32;

export const supportsV0V1Multilocation = (api: AnyApi): boolean => {
  try {
    const keys = (api.createType("XcmVersionedMultiLocation") as any)
      .defKeys as string[];

    return keys.includes("V0");
  } catch (e) {
    // ignore error
  }

  return false;
};
