import { CrossChainFeeConfig } from "src/types";

export const kicoXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
  kico: {
    KICO: { fee: "96000000000", existentialDeposit: "100000000000000", decimals: 14 },
    KAR: { fee: "160000000000", existentialDeposit: "0", decimals: 12 },
    KUSD: { fee: "320000000000", existentialDeposit: "0", decimals: 12 },
  },
};
