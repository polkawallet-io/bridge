import { CrossChainFeeConfig } from "src/types";

export const integriteeXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
  integritee: {
    TEER: { fee: "4000000", existentialDeposit: "100000000000", decimals: 12 },
  },
};
