import { CrossChainFeeConfig } from "src/types";

export const polkadotXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
  polkadot: {
    DOT: { fee: "482771104", existentialDeposit: "10000000000", decimals: 10 },
  },
  kusama: {
    KSM: { fee: "79999999", existentialDeposit: "33333333", decimals: 12 },
  },
};

export const statemineXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
  statemine: {
    KSM: { fee: "4000000000", existentialDeposit: "33333333", decimals: 12 },
    RMRK: { fee: "16000000000", existentialDeposit: "100000000", decimals: 10 },
    USDT: { fee: "16000000000", existentialDeposit: "1000", decimals: 8 },
    ARIS: { fee: "16000000000", existentialDeposit: "10000000", decimals: 8 },
  },
};
