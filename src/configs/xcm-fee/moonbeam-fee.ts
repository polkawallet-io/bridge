import { CrossChainFeeConfig } from "src/types";

export const moonbeamXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
  moonriver: {
    MOVR: { fee: "80000000000000", existentialDeposit: "1000000000000000" },
    KAR: { fee: "9880000000", existentialDeposit: "0" },
    KUSD: { fee: "16536000000", existentialDeposit: "0" },
  },
  moonbeam: {
    GLMR: { fee: "8000000000000000", existentialDeposit: "100000000000000000" },
    ACA: { fee: "24963428577", existentialDeposit: "100000000000" },
    AUSD: { fee: "2000000000", existentialDeposit: "100000000000" },
  },
};
