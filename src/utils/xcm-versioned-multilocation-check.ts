import { AnyApi } from "@acala-network/sdk-core";

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
