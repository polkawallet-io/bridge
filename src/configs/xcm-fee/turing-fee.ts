import { CrossChainFeeConfig } from "src/types";

export const turingXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
  turing: {
    TUR: { fee: "1664000000", existentialDeposit: "100000000" },
    KAR: { fee: "32000000000", existentialDeposit: "100000000000" },
    KUSD: { fee: "256000000000", existentialDeposit: "10000000000" },
    LKSM: { fee: "6400000000", existentialDeposit: "500000000" },
  },
};
