import { BN } from '@polkadot/util';

import { CrossChainRouterConfigs, FN } from '../../types';

export const khalaRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  khala: [
    { to: 'karura', token: 'PHA', xcm: { fee: { token: 'PHA', balance: FN.fromInner('51200000000', 12) }, weightLimit: new BN(5_000_000_000) } },
    { to: 'karura', token: 'KUSD', xcm: { fee: { token: 'KUSD', balance: FN.fromInner('4616667257', 12) }, weightLimit: new BN(5_000_000_000) } },
    { to: 'karura', token: 'KAR', xcm: { fee: { token: 'KAR', balance: FN.fromInner('6400000000', 12) }, weightLimit: new BN(5_000_000_000) } }
  ]
};
