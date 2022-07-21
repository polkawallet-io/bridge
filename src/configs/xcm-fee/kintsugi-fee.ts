import { CrossChainFeeConfig } from 'src/types';

export const kintsugiXcmFeeConfig: Record<string, Record<string, CrossChainFeeConfig>> = {
  kintsugi: {
    KINT: { fee: '170666666', existentialDeposit: '0', decimals: 12 },
    KBTC: { fee: '85', existentialDeposit: '0', decimals: 8 }
  },
  interlay: {
    INTR: { fee: '21787589', existentialDeposit: '0', decimals: 10 },
    IBTC: { fee: '85', existentialDeposit: '0', decimals: 8 }
  }
};
