import { CrossChainFeeConfig } from "src/types";

export const calamariXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
  calamari: {
    KMA: { fee: "4000000", existentialDeposit: "100000000000" },
    KUSD: { fee: "100000000000", existentialDeposit: "10000000000" },
    KAR: { fee: "100000000000", existentialDeposit: "100000000000" },
    LKSM: { fee: "7692307692", existentialDeposit: "500000000" },
  },
};
