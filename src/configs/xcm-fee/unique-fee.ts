import { CrossChainFeeConfig } from "src/types";

export const uniqueXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
  quartz: {
    QTZ: { fee: "0", existentialDeposit: "1000000000000000000", decimals: 18 },
  },
};
