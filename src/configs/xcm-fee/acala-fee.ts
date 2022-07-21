import { CrossChainFeeConfig } from 'src/types';

export const acalaXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
  acala: {
    // common
    DOT: { fee: '4285630', existentialDeposit: '1000000000', decimals: 10 },
    ACA: { fee: '6400000000', existentialDeposit: '100000000000', decimals: 12 },
    AUSD: { fee: '3721109059', existentialDeposit: '100000000000', decimals: 12 },
    LDOT: { fee: '24037893', existentialDeposit: '500000000', decimals: 10 },
    // parallel
    PARA: { fee: '6400000000', existentialDeposit: '100000000000', decimals: 12 },
    // moonbeam
    GLMR: { fee: '6400000000000000', existentialDeposit: '100000000000000000', decimals: 18 },
    // interlay
    INTR: { fee: '93240000', existentialDeposit: '1000000000', decimals: 10 }
  }
};

export const karuraXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
  karura: {
    // common
    KSM: { fee: '64000000', existentialDeposit: '100000000', decimals: 12 },
    KAR: { fee: '6400000000', existentialDeposit: '100000000000', decimals: 12 },
    KUSD: { fee: '10011896008', existentialDeposit: '10000000000', decimals: 12 },
    AUSD: { fee: '10011896008', existentialDeposit: '10000000000', decimals: 12 },
    LKSM: { fee: '589618748', existentialDeposit: '500000000', decimals: 12 },
    // bifrost
    BNC: { fee: '5120000000', existentialDeposit: '10000000000', decimals: 12 },
    VSKSM: { fee: '64000000', existentialDeposit: '100000000', decimals: 12 },
    // statemine
    RMRK: { fee: '6400000', existentialDeposit: '100000000', decimals: 10 },
    USDT: { fee: '64', existentialDeposit: '1000', decimals: 8 },
    ARIS: { fee: '6400000', existentialDeposit: '1000000000000', decimals: 8 },
    // quartz
    QTZ: { fee: '64000000000000000', existentialDeposit: '1000000000000000000', decimals: 18 },
    // kintsugi
    KINT: { fee: '170666666', existentialDeposit: '0', decimals: 12 },
    KBTC: { fee: '85', existentialDeposit: '0', decimals: 8 },
    // parallel heiko
    HKO: { fee: '6400000000', existentialDeposit: '100000000000', decimals: 12 },
    // khala
    PHA: { fee: '51200000000', existentialDeposit: '40000000000', decimals: 12 },
    // moonriver
    MOVR: { fee: '0', existentialDeposit: '1000000000000000', decimals: 18 },
    // kiko
    KICO: { fee: '6400000000000', existentialDeposit: '100000000000000', decimals: 14 },
    // crust shadow
    CSM: { fee: '64000000000', existentialDeposit: '1000000000000', decimals: 12 },
    // calamari
    KMA: { fee: '6400000000', existentialDeposit: '100000000000', decimals: 12 },
    // integritee
    TEER: { fee: '6400000000', existentialDeposit: '100000000000', decimals: 12 },
    // altair
    AIR: { fee: '6400000000000000', existentialDeposit: '1000000000000', decimals: 18 },
    // shiden
    SDN: { fee: '932400000000000', existentialDeposit: '10000000000000000', decimals: 18 },
    // pichiu
    PCHU: { fee: '9324000000000000', existentialDeposit: '100000000000000000', decimals: 18 },
    // crab
    CRAB: { fee: '64000000000000000', existentialDeposit: '1000000000000000000', decimals: 18 },
    // turing
    TUR: { fee: '2560000000', existentialDeposit: '40000000000', decimals: 10 }
  }
};
