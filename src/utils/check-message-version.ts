import { AnyApi } from "@acala-network/sdk-core";

export type XCMVersion = "V1" | "V3" | "V4";

export function checkMessageVersion(api: AnyApi) {
  let version: XCMVersion = "V1";

  try {
    const keys = (api?.createType("XcmVersionedMultiLocation") as any)
      .defKeys as string[];

    if (keys.includes("V3")) {
      version = "V3";
    }
  } catch (e) {
    // ignore
  }

  try {
    const keys = (api?.createType("StagingXcmVersionedMultiLocation") as any)
      .defKeys as string[];

    if (keys.includes("V3")) {
      version = "V3";
    }
  } catch (e) {
    // ignore
  }

  try {
    api?.createType("StagingXcmVersionedLocation") as any;

    version = "V4";
  } catch (e) {
    // ignore
  }

  return version;
}
