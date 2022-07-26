import { BN } from '@polkadot/util';

import { CrossChainRouterConfigs, FN } from '../../types';

export const mantaRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  calamari: [
    { to: 'karura', token: 'KMA', xcm: { fee: { token: 'KMA', balance: FN.fromInner('6400000000', 12) }, weightLimit: new BN(5_000_000_000) } },
    { to: 'karura', token: 'KUSD', xcm: { fee: { token: 'KUSD', balance: FN.fromInner('6381112603', 12) }, weightLimit: new BN(5_000_000_000) } },
    { to: 'karura', token: 'KAR', xcm: { fee: { token: 'KAR', balance: FN.fromInner('6400000000', 12) }, weightLimit: new BN(5_000_000_000) } },
    { to: 'karura', token: 'LKSM', xcm: { fee: { token: 'LKSM', balance: FN.fromInner('452334406', 12) }, weightLimit: new BN(5_000_000_000) } },
    { to: 'karura', token: 'KSM', xcm: { fee: { token: 'KSM', balance: FN.fromInner('54632622', 12) }, weightLimit: new BN(5_000_000_000) } }
  ]
};
