import { CrossChainRouterConfigs, FN } from '../../types';

export const darwiniaRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  crab: [
    { to: 'karura', token: 'CRAB', xcm: { fee: { token: 'DOT', balance: new FN('64000000000000000') }, weightLimit: new FN(5_000_000_000) } }
  ]
  // crab: {
  //   CRAB: { fee: '4000000000', existentialDeposit: '0', decimals: 18 }
  // }
};
