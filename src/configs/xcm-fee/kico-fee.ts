import { CrossChainFeeConfig } from "src/types";

export const kicoXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
  kico: {
    KICO: { fee: "96000000000", existentialDeposit: "100000000000000" },
    KAR: { fee: "160000000000", existentialDeposit: "0" },
    KUSD: { fee: "320000000000", existentialDeposit: "0" },
  },
};
