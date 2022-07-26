import { BN } from '@polkadot/util';

import { CrossChainRouterConfigs, FN } from '../../types';

export const centrifugeRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  altair: [
    { to: 'karura', token: 'AIR', xcm: { fee: { token: 'AIR', balance: FN.fromInner('6400000000000000', 18) }, weightLimit: new BN(5_000_000_000) } },
    { to: 'karura', token: 'KUSD', xcm: { fee: { token: 'KUSD', balance: FN.fromInner('3481902463', 12) }, weightLimit: new BN(5_000_000_000) } }
  ]
};
