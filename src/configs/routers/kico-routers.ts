import { CrossChainRouterConfigs, FN } from '../../types';

export const kicoRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  kico: [
    { to: 'karura', token: 'KICO', xcm: { fee: { token: 'DOT', balance: new FN('6400000000000') }, weightLimit: new FN(5_000_000_000) } }
  ]
  // kico: {
  //   KICO: { fee: '96000000000', existentialDeposit: '100000000000000', decimals: 14 },
  //   KAR: { fee: '160000000000', existentialDeposit: '0', decimals: 12 },
  //   KUSD: { fee: '320000000000', existentialDeposit: '0', decimals: 12 }
  // }
};
