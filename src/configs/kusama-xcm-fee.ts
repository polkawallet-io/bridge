import { CrossChainFeeConfig } from "src/types";

export const kusamaXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
  kusama: {
    KSM: {
      fee: "79999999",
      existentialDeposit: "33333333",
    },
  },
  karura: {
    // common
    KSM: { fee: "64000000", existentialDeposit: "100000000" },
    KAR: { fee: "6400000000", existentialDeposit: "100000000000" },
    KUSD: { fee: "10011896008", existentialDeposit: "10000000000" },
    LKSM: { fee: "589618748", existentialDeposit: "500000000" },
    // bifrost
    BNC: { fee: "5120000000", existentialDeposit: "10000000000" },
    VSKSM: { fee: "64000000", existentialDeposit: "100000000" },
    // statemine
    RMRK: { fee: "6400000", existentialDeposit: "100000000" },
    USDT: { fee: "64", existentialDeposit: "1000" },
    ARIS: { fee: "6400000", existentialDeposit: "10000000" },
    // quartz
    QTZ: { fee: "64000000000000000", existentialDeposit: "1000000000000000000" },
    // kintsugi
    KINT: { fee: "170666666", existentialDeposit: "0" },
    KBTC: { fee: "85", existentialDeposit: "0" },
    // parallel heiko
    HKO: { fee: "6400000000", existentialDeposit: "100000000000" },
    // khala
    PHA: { fee: "51200000000", existentialDeposit: "40000000000" },
    // moonriver
    MOVR: { fee: "0", existentialDeposit: "1000000000000000" },
    // kiko
    KICO: { fee: "6400000000000", existentialDeposit: "100000000000000" },
    // crust shadow
    CSM: { fee: "64000000000", existentialDeposit: "1000000000000" },
    // calamari
    KMA: { fee: "6400000000", existentialDeposit: "100000000000" },
    // integritee
    TEER: { fee: "6400000000", existentialDeposit: "100000000000" },
    // altair
    AIR: { fee: "6400000000000000", existentialDeposit: "1000000000000" },
  },
  bifrost: {
    KAR: {
      fee: "4800000000",
      existentialDeposit: "148000000",
    },
    KSM: {
      fee: "64000000",
      existentialDeposit: "100000000",
    },
    KUSD: {
      fee: "25600000000",
      existentialDeposit: "100000000",
    },
    BNC: {
      fee: "5120000000",
      existentialDeposit: "10000000000",
    },
    VSKSM: {
      fee: "64000000",
      existentialDeposit: "100000000",
    },
  },
  quartz: {
    QTZ: {
      fee: "0",
      existentialDeposit: "1000000000000000000",
    },
  },
  kintsugi: {
    KINT: {
      fee: "170666666",
      existentialDeposit: "0",
    },
    KBTC: {
      fee: "85",
      existentialDeposit: "0",
    },
  },
  // heiko: {
  //   KAR: {
  //     fee: "2400000000",
  //     existentialDeposit: "0",
  //   },
  //   KUSD: {
  //     fee: "19200000000",
  //     existentialDeposit: "0",
  //   },
  //   LKSM: {
  //     fee: "48000000",
  //     existentialDeposit: "0",
  //   },
  //   HKO: {
  //     fee: "1440000000",
  //     existentialDeposit: "100000000000",
  //   },
  // },
  khala: {
    PHA: {
      fee: "64000000000",
      existentialDeposit: "40000000000",
    },
    KUSD: {
      fee: "16000000000",
      existentialDeposit: "10000000000",
    },
    KAR: {
      fee: "8000000000",
      existentialDeposit: "10000000000",
    },
  },
  // moonriver: {
  //   MOVR: {
  //     fee: "80000000000000",
  //     existentialDeposit: "1000000000000000",
  //   },
  //   KAR: {
  //     fee: "9880000000",
  //     existentialDeposit: "0",
  //   },
  //   KUSD: {
  //     fee: "16536000000",
  //     existentialDeposit: "0",
  //   },
  // },
  // kico: {
  //   KICO: {
  //     fee: "96000000000",
  //     existentialDeposit: "100000000000000",
  //   },
  //   KAR: {
  //     fee: "160000000000",
  //     existentialDeposit: "0",
  //   },
  //   KUSD: {
  //     fee: "320000000000",
  //     existentialDeposit: "0",
  //   },
  // },
  // shadow: {
  //   CSM: {
  //     fee: "4000000000",
  //     existentialDeposit: "1000000000000",
  //   },
  // },
  // calamari: {
  //   KMA: {
  //     fee: "4000000",
  //     existentialDeposit: "100000000000",
  //   },
  //   KUSD: {
  //     fee: "100000000000",
  //     existentialDeposit: "10000000000",
  //   },
  //   KAR: {
  //     fee: "100000000000",
  //     existentialDeposit: "100000000000",
  //   },
  //   LKSM: {
  //     fee: "7692307692",
  //     existentialDeposit: "500000000",
  //   },
  // },
  // integritee: {
  //   TEER: {
  //     fee: "4000000",
  //     existentialDeposit: "100000000000",
  //   },
  // },
  // altair: {
  //   AIR: {
  //     fee: "6400000000000000",
  //     existentialDeposit: "1000000000000",
  //   },
  //   KUSD: {
  //     fee: "51200000000",
  //     existentialDeposit: "10000000000",
  //   },
  // },
};

export const kusamaCommonXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
  statemine: {
    RMRK: {
      fee: "16000000000",
      existentialDeposit: "100000000",
    },
    USDT: {
      fee: "16000000000",
      existentialDeposit: "1000",
    },
    ARIS: {
      fee: "16000000000",
      existentialDeposit: "10000000",
    },
  },
};
