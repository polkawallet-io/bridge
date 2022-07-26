import { BN } from '@polkadot/util';

import { CrossChainRouterConfigs, FN } from '../../types';

export const interlayRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  kintsugi: [
    { to: 'karura', token: 'KINT', xcm: { fee: { token: 'KINT', balance: FN.fromInner('170666666', 12) }, weightLimit: new BN(5_000_000_000) } },
    { to: 'karura', token: 'KBTC', xcm: { fee: { token: 'KBTC', balance: FN.fromInner('85', 8) }, weightLimit: new BN(5_000_000_000) } }
  ],
  interlay: [
    { to: 'acala', token: 'INTR', xcm: { fee: { token: 'INTR', balance: FN.fromInner('93240000', 10) }, weightLimit: new BN(5_000_000_000) } }
  ]
};
