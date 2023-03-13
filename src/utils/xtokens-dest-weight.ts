import { AnyApi } from "@acala-network/sdk-core";

/**
 * Returns whether xToken.transfer's fourth parameter (destination weight)
 * supports a destination weight of "Unlimited".
 * @param api The api of which to check the pallet
 * @returns true if "Unlimited" is supported, false otherwise
 */
export const supportsUnlimitedDestWeight = (api: AnyApi): boolean =>
  api.tx.xTokens.transfer.meta.args[3].type.toString() === "XcmV2WeightLimit";
