import { BN } from '@polkadot/util';

import { CrossChainRouterConfigs, FN } from '../../types';

export const kylinRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  pichiu: [
    { to: 'karura', token: 'PCHU', xcm: { fee: { token: 'PCHU', balance: FN.fromInner('9324000000000000', 18) }, weightLimit: new BN(5_000_000_000) } },
    { to: 'karura', token: 'KAR', xcm: { fee: { token: 'KAR', balance: FN.fromInner('9324000000', 12) }, weightLimit: new BN(5_000_000_000) } },
    { to: 'karura', token: 'KUSD', xcm: { fee: { token: 'KUSD', balance: FN.fromInner('5060238106', 12) }, weightLimit: new BN(5_000_000_000) } },
    { to: 'karura', token: 'LKSM', xcm: { fee: { token: 'LKSM', balance: FN.fromInner('700170039', 12) }, weightLimit: new BN(5_000_000_000) } }
  ]
};
