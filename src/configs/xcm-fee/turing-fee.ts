import { CrossChainFeeConfig } from 'src/types';

export const turingXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
  turing: {
    TUR: { fee: '1664000000', existentialDeposit: '100000000', decimals: 10 },
    KAR: { fee: '32000000000', existentialDeposit: '100000000000', decimals: 12 },
    KUSD: { fee: '256000000000', existentialDeposit: '10000000000', decimals: 12 },
    LKSM: { fee: '6400000000', existentialDeposit: '500000000', decimals: 12 }
  }
};
