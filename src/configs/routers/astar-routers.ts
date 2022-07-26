
import { CrossChainRouterConfigs, FN } from '../../types';

export const astarRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  shiden: [
    { to: 'karura', token: 'SDN', xcm: { fee: { token: 'SDN', balance: FN.fromInner('932400000000000', 18) }, weightLimit: 'Unlimited' } },
    { to: 'karura', token: 'KUSD', xcm: { fee: { token: 'KUSD', balance: FN.fromInner('3826597686', 12) }, weightLimit: 'Unlimited' } }
  ]
};
