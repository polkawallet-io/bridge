import { CrossChainRouterConfigs, FN } from '../../types';

export const uniqueRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  quartz: [
    { to: 'karura', token: 'QTZ', xcm: { fee: { token: 'QTZ', balance: new FN('64000000000000000') }, weightLimit: new FN(5_000_000_000) } }
  ]
  // quartz: {
  //   QTZ: { fee: '0', existentialDeposit: '1000000000000000000', decimals: 18 }
  // }
};
