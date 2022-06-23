import { CrossChainFeeConfig } from "src/types";

export const bifrostXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
  bifrost: {
    KAR: { fee: "4800000000", existentialDeposit: "148000000" },
    KSM: { fee: "64000000", existentialDeposit: "100000000" },
    KUSD: { fee: "25600000000", existentialDeposit: "100000000" },
    BNC: { fee: "5120000000", existentialDeposit: "10000000000" },
    VSKSM: { fee: "64000000", existentialDeposit: "100000000" },
  },
};
