import { CrossChainRouterConfigs, FN } from '../../types';

export const crustRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  shadow: [
    { to: 'karura', token: 'CSM', xcm: { fee: { token: 'DOT', balance: new FN('64000000000') }, weightLimit: new FN(5_000_000_000) } }
  ]
  // shadow: {
  //   CSM: { fee: '4000000000', existentialDeposit: '1000000000000', decimals: 12 }
  // }
};
