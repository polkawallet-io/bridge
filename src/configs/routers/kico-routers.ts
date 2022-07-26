import { BN } from '@polkadot/util';

import { CrossChainRouterConfigs, FN } from '../../types';

export const kicoRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  kico: [
    { to: 'karura', token: 'KICO', xcm: { fee: { token: 'KICO', balance: FN.fromInner('6400000000000', 14) }, weightLimit: new BN(5_000_000_000) } },
    { to: 'karura', token: 'KAR', xcm: { fee: { token: 'KAR', balance: FN.fromInner('6400000000', 12) }, weightLimit: new BN(5_000_000_000) } },
    { to: 'karura', token: 'KUSD', xcm: { fee: { token: 'KUSD', balance: FN.fromInner('10011896008', 12) }, weightLimit: new BN(5_000_000_000) } }
  ]
};
