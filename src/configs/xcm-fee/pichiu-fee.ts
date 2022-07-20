import { CrossChainFeeConfig } from "src/types";

export const pichiuXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
  pichiu: {
    PCHU: { fee: "400000000000000", existentialDeposit: "1000000000000", decimals: 18 },
    KUSD: { fee: "400000000", existentialDeposit: "10000000000", decimals: 12 },
    KAR: { fee: "400000000", existentialDeposit: "100000000000", decimals: 12 },
    LKSM: { fee: "400000000", existentialDeposit: "500000000", decimals: 12 },
  },
};
