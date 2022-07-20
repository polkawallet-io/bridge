import { CrossChainFeeConfig } from "src/types";

export const mantaXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
  calamari: {
    KMA: { fee: "4000000", existentialDeposit: "100000000000", decimals: 12 },
    KUSD: { fee: "100000000000", existentialDeposit: "10000000000", decimals: 12 },
    KAR: { fee: "100000000000", existentialDeposit: "100000000000", decimals: 12 },
    LKSM: { fee: "7692307692", existentialDeposit: "500000000", decimals: 12 },
    KSM: { fee: "666666666", existentialDeposit: "100000000", decimals: 12 },
  },
};
