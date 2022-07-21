import { CrossChainFeeConfig } from 'src/types';

export const astarXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
  shiden: {
    SDN: { fee: '4662276356431024', existentialDeposit: '1000000', decimals: 18 },
    KUSD: { fee: '1200000000', existentialDeposit: '1', decimals: 12 }
  }
};
