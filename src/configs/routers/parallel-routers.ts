import { BN } from '@polkadot/util';

import { CrossChainRouterConfigs, FN } from '../../types';

export const parallelRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  heiko: [
    { to: 'karura', token: 'HKO', xcm: { fee: { token: 'HKO', balance: FN.fromInner('6400000000', 12) }, weightLimit: new BN(5_000_000_000) } },
    { to: 'karura', token: 'KAR', xcm: { fee: { token: 'KAR', balance: FN.fromInner('6400000000', 12) }, weightLimit: new BN(5_000_000_000) } },
    { to: 'karura', token: 'KUSD', xcm: { fee: { token: 'KUSD', balance: FN.fromInner('8305746640', 12) }, weightLimit: new BN(5_000_000_000) } },
    { to: 'karura', token: 'LKSM', xcm: { fee: { token: 'LKSM', balance: FN.fromInner('589618748', 12) }, weightLimit: new BN(5_000_000_000) } }
  ],
  parallel: [
    { to: 'acala', token: 'PARA', xcm: { fee: { token: 'PARA', balance: FN.fromInner('6400000000', 12) }, weightLimit: new BN(5_000_000_000) } },
    { to: 'acala', token: 'ACA', xcm: { fee: { token: 'ACA', balance: FN.fromInner('6400000000', 12) }, weightLimit: new BN(5_000_000_000) } },
    { to: 'acala', token: 'AUSD', xcm: { fee: { token: 'AUSD', balance: FN.fromInner('3721109059', 12) }, weightLimit: new BN(5_000_000_000) } },
    { to: 'acala', token: 'LDOT', xcm: { fee: { token: 'LDOT', balance: FN.fromInner('24037893', 10) }, weightLimit: new BN(5_000_000_000) } }
  ]
};
