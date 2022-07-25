import { BN } from '@polkadot/util';

import { CrossChainRouterConfigs, FN } from '../../types';

export const kicoRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  kico: [
    { to: 'karura', token: 'KICO', xcm: { fee: { token: 'KICO', balance: FN.fromInner('6400000000000', 14) }, weightLimit: new BN(5_000_000_000) } }
  ]
  // kico: {
  //   KICO: { fee: '96000000000', existentialDeposit: '100000000000000', decimals: 14 },
  //   KAR: { fee: '160000000000', existentialDeposit: '0', decimals: 12 },
  //   KUSD: { fee: '320000000000', existentialDeposit: '0', decimals: 12 }
  // }
};
