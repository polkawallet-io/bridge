import { CrossChainFeeConfig } from 'src/types';

export const centrifugeXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
  altair: {
    AIR: { fee: '6400000000000000', existentialDeposit: '1000000000000', decimals: 18 },
    KUSD: { fee: '51200000000', existentialDeposit: '10000000000', decimals: 12 }
  }
};
