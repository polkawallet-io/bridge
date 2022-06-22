import { CrossChainFeeConfig } from "src/types";

export const polkadotXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
  polkadot: {
    DOT: {
      fee: "482771104",
      existentialDeposit: "10000000000",
    },
  },
  acala: {
    DOT: {
      fee: "4285630",
      existentialDeposit: "1000000000",
    },
  },
  // parallel: {
  //   PARA: {
  //     fee: "9600000000",
  //     existentialDeposit: "100000000000",
  //   },
  //   ACA: {
  //     fee: "1920000000",
  //     existentialDeposit: "100000000000",
  //   },
  //   AUSD: {
  //     fee: "2880000000",
  //     existentialDeposit: "100000000000",
  //   },
  //   LDOT: {
  //     fee: "96000000",
  //     existentialDeposit: "500000000",
  //   },
  // },
  // moonbeam: {
  //   GLMR: {
  //     fee: "8000000000000000",
  //     existentialDeposit: "100000000000000000",
  //   },
  //   ACA: {
  //     fee: "24963428577",
  //     existentialDeposit: "100000000000",
  //   },
  //   AUSD: {
  //     fee: "2000000000",
  //     existentialDeposit: "100000000000",
  //   },
  // },
};
