import { BN } from '@polkadot/util';

import { CrossChainRouterConfigs, FN } from '../../types';

export const centrifugeRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  altair: [
    { to: 'karura', token: 'AIR', xcm: { fee: { token: 'AIR', balance: FN.fromInner('6400000000000000', 18) }, weightLimit: new BN(5_000_000_000) } }
  ]
  // altair: {
  //   AIR: { fee: '6400000000000000', existentialDeposit: '1000000000000', decimals: 18 },
  //   KUSD: { fee: '51200000000', existentialDeposit: '10000000000', decimals: 12 }
  // }
};
