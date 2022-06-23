import { CrossChainFeeConfig } from "src/types";

export const polkadotXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
  polkadot: {
    KSM: {
      fee: "482771104",
      existentialDeposit: "10000000000",
    },
  },
  kusama: {
    KSM: {
      fee: "79999999",
      existentialDeposit: "33333333",
    },
  },
};

export const statemineXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
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
