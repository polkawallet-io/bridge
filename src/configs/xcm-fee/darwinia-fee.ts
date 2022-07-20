import { CrossChainFeeConfig } from "src/types";

export const darwiniaXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
  crab: {
    CRAB: { fee: "4000000000", existentialDeposit: "0", decimals: 18 },
  },
};
