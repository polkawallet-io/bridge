import { CrossChainRouterConfigs, FN } from '../../types';

export const mantaRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  calamari: [
    { to: 'karura', token: 'KMA', xcm: { fee: { token: 'DOT', balance: new FN('6400000000') }, weightLimit: new FN(5_000_000_000) } }
  ]
  // calamari: {
  //   KMA: { fee: '4000000', existentialDeposit: '100000000000', decimals: 12 },
  //   KUSD: { fee: '100000000000', existentialDeposit: '10000000000', decimals: 12 },
  //   KAR: { fee: '100000000000', existentialDeposit: '100000000000', decimals: 12 },
  //   LKSM: { fee: '7692307692', existentialDeposit: '500000000', decimals: 12 },
  //   KSM: { fee: '666666666', existentialDeposit: '100000000', decimals: 12 }
  // }
};
