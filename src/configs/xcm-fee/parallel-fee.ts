import { CrossChainFeeConfig } from "src/types";

export const parallelXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
  heiko: {
    HKO: { fee: "1440000000", existentialDeposit: "100000000000" },
    KAR: { fee: "2400000000", existentialDeposit: "0" },
    KUSD: { fee: "19200000000", existentialDeposit: "0" },
    LKSM: { fee: "48000000", existentialDeposit: "0" },
  },
  parallel: {
    PARA: { fee: "9600000000", existentialDeposit: "100000000000" },
    ACA: { fee: "1920000000", existentialDeposit: "100000000000" },
    AUSD: { fee: "2880000000", existentialDeposit: "100000000000" },
    LDOT: { fee: "96000000", existentialDeposit: "500000000" },
  },
};
