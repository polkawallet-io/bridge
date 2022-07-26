
import { CrossChainRouterConfigs, FN } from '../../types';

export const darwiniaRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  crab: [
    { to: 'karura', token: 'CRAB', xcm: { fee: { token: 'CRAB', balance: FN.fromInner('64000000000000000', 18) }, weightLimit: 'Unlimited' } }
  ]
};
