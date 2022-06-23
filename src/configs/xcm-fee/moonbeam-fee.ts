import { CrossChainFeeConfig } from "src/types";

export const moonbeamXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
  moonriver: {
    MOVR: { fee: "80000000000000", existentialDeposit: "1000000000000000" },
  },
  moonbeam: {
    GLMR: { fee: "8000000000000000", existentialDeposit: "100000000000000000" },
  },
};
