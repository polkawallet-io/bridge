import { CrossChainFeeConfig } from "src/types";

export const khalaXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
  khala: {
    PHA: { fee: "64000000000", existentialDeposit: "40000000000" },
    KUSD: { fee: "16000000000", existentialDeposit: "10000000000" },
    KAR: { fee: "8000000000", existentialDeposit: "10000000000" },
  },
};
