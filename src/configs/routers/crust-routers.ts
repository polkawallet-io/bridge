
import { CrossChainRouterConfigs, FN } from '../../types';

export const crustRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  shadow: [
    { to: 'karura', token: 'CSM', xcm: { fee: { token: 'CSM', balance: FN.fromInner('64000000000', 12) }, weightLimit: 'Unlimited' } }
  ]
};
