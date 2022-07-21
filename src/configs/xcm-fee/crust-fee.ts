import { CrossChainFeeConfig } from 'src/types';

export const crustXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
  shadow: {
    CSM: { fee: '4000000000', existentialDeposit: '1000000000000', decimals: 12 }
  }
};
