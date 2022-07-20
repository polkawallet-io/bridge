import { CrossChainFeeConfig } from "src/types";

export const acalaXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
  acala: {
    // common
    DOT: { fee: "4285630", existentialDeposit: "1000000000" },
    ACA: { fee: "6400000000", existentialDeposit: "100000000000" },
    AUSD: { fee: "3721109059", existentialDeposit: "100000000000" },
    LDOT: { fee: "24037893", existentialDeposit: "500000000" },
    // parallel
    PARA: { fee: "6400000000", existentialDeposit: "100000000000" },
    // moonbeam
    GLMR: { fee: "6400000000000000", existentialDeposit: "100000000000000000" },
    // interlay
    INTR: { fee: "93240000", existentialDeposit: "1000000000" },
  },
};

export const karuraXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
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
    // shiden
    SDN: { fee: "932400000000000", existentialDeposit: "10000000000000000" },
    // pichiu
    PCHU: { fee: "9324000000000000", existentialDeposit: "100000000000000000" },
  },
};
