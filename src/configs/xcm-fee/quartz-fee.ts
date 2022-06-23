import { CrossChainFeeConfig } from "src/types";

export const quartzXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
  quartz: {
    QTZ: { fee: "0", existentialDeposit: "1000000000000000000" },
  },
};
