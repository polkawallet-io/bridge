import { BN } from '@polkadot/util';

import { CrossChainRouterConfigs, FN } from '../../types';

export const integriteeRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  integritee: [
    { to: 'karura', token: 'TEER', xcm: { fee: { token: 'TEER', balance: FN.fromInner('6400000000', 12) }, weightLimit: new BN(5_000_000_000) } }
  ]
};
