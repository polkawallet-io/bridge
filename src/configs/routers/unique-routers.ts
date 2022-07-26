
import { CrossChainRouterConfigs, FN } from '../../types';

export const uniqueRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  quartz: [
    { to: 'karura', token: 'QTZ', xcm: { fee: { token: 'QTZ', balance: FN.fromInner('64000000000000000', 18) }, weightLimit: 'Unlimited' } }
  ]
};
