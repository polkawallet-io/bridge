import { CrossChainRouterConfigs, FN } from '../../types';

export const bifrostRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  bifrost: [
    { to: 'karura', token: 'BNC', xcm: { fee: { token: 'DOT', balance: new FN('5120000000') }, weightLimit: new FN(5_000_000_000) } }
  ]
  // bifrost: {
  //   KAR: { fee: '4800000000', existentialDeposit: '148000000', decimals: 12 },
  //   KSM: { fee: '64000000', existentialDeposit: '100000000', decimals: 12 },
  //   KUSD: { fee: '25600000000', existentialDeposit: '100000000', decimals: 12 },
  //   AUSD: { fee: '25600000000', existentialDeposit: '100000000', decimals: 12 },
  //   BNC: { fee: '5120000000', existentialDeposit: '10000000000', decimals: 12 },
  //   VSKSM: { fee: '64000000', existentialDeposit: '100000000', decimals: 12 }
  // }
};
