import { CrossChainRouterConfigs, FN } from '../../types';

export const centrifugeRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  altair: [
    { to: 'karura', token: 'AIR', xcm: { fee: { token: 'DOT', balance: new FN('6400000000000000') }, weightLimit: new FN(5_000_000_000) } }
  ]
  // altair: {
  //   AIR: { fee: '6400000000000000', existentialDeposit: '1000000000000', decimals: 18 },
  //   KUSD: { fee: '51200000000', existentialDeposit: '10000000000', decimals: 12 }
  // }
};
