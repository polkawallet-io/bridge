import { BN } from '@polkadot/util';

import { CrossChainRouterConfigs, FN } from '../../types';

export const interlayRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  kintsugi: [
    { to: 'karura', token: 'KINT', xcm: { fee: { token: 'KINT', balance: FN.fromInner('170666666', 12) }, weightLimit: new BN(5_000_000_000) } }
  ],
  interlay: [
    { to: 'karura', token: 'INTR', xcm: { fee: { token: 'INTR', balance: FN.fromInner('93240000', 10) }, weightLimit: new BN(5_000_000_000) } }
  ]
  // kintsugi: {
  //   KINT: { fee: '170666666', existentialDeposit: '0', decimals: 12 },
  //   KBTC: { fee: '85', existentialDeposit: '0', decimals: 8 }
  // },
  // interlay: {
  //   INTR: { fee: '21787589', existentialDeposit: '0', decimals: 10 },
  //   IBTC: { fee: '85', existentialDeposit: '0', decimals: 8 }
  // }
};
