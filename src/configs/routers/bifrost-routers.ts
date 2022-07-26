import { BN } from '@polkadot/util';

import { CrossChainRouterConfigs, FN } from '../../types';

export const bifrostRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  bifrost: [
    { to: 'karura', token: 'BNC', xcm: { fee: { token: 'BNC', balance: FN.fromInner('5120000000', 12) }, weightLimit: new BN(5_000_000_000) } },
    { to: 'karura', token: 'VSKSM', xcm: { fee: { token: 'VSKSM', balance: FN.fromInner('64000000', 12) }, weightLimit: new BN(5_000_000_000) } },
    { to: 'karura', token: 'KSM', xcm: { fee: { token: 'KSM', balance: FN.fromInner('64000000', 12) }, weightLimit: new BN(5_000_000_000) } },
    { to: 'karura', token: 'KAR', xcm: { fee: { token: 'KAR', balance: FN.fromInner('6400000000', 12) }, weightLimit: new BN(5_000_000_000) } },
    { to: 'karura', token: 'KUSD', xcm: { fee: { token: 'KUSD', balance: FN.fromInner('10011896008', 12) }, weightLimit: new BN(5_000_000_000) } }
  ]
};
