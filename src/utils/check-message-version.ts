import { AnyApi } from "@acala-network/sdk-core";

export function checkMessageVersionIsV3(api: AnyApi) {
  try {
    const keys = (api?.createType("XcmVersionedMultiLocation") as any)
      .defKeys as string[];

    return keys.includes("V3");
  } catch (e) {
    try {
      const keys = (api?.createType("StagingXcmVersionedMultiLocation") as any)
        .defKeys as string[];

      return keys.includes("V3");
    } catch (e) {
      // ignore
    }
    // ignore error
  }

  return false;
}
