import { BN } from '@polkadot/util';

import { CrossChainRouterConfigs, FN } from '../../types';

export const turingRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  turing: [
    { to: 'karura', token: 'TUR', xcm: { fee: { token: 'TUR', balance: FN.fromInner('2560000000', 10) }, weightLimit: new BN(5_000_000_000) } },
    { to: 'karura', token: 'KAR', xcm: { fee: { token: 'KAR', balance: FN.fromInner('6400000000', 12) }, weightLimit: new BN(5_000_000_000) } },
    { to: 'karura', token: 'KUSD', xcm: { fee: { token: 'KUSD', balance: FN.fromInner('2626579278', 12) }, weightLimit: new BN(5_000_000_000) } },
    { to: 'karura', token: 'LKSM', xcm: { fee: { token: 'LKSM', balance: FN.fromInner('480597195', 12) }, weightLimit: new BN(5_000_000_000) } }
  ]
};
