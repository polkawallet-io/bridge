import { BN } from '@polkadot/util';

import { CrossChainRouterConfigs, FN } from '../../types';

export const pichiuRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  pichiu: [
    { to: 'karura', token: 'PCHU', xcm: { fee: { token: 'PCHU', balance: FN.fromInner('9324000000000000', 18) }, weightLimit: new BN(5_000_000_000) } }
  ]
  // pichiu: {
  //   PCHU: { fee: '400000000000000', existentialDeposit: '1000000000000', decimals: 18 },
  //   KUSD: { fee: '400000000', existentialDeposit: '10000000000', decimals: 12 },
  //   KAR: { fee: '400000000', existentialDeposit: '100000000000', decimals: 12 },
  //   LKSM: { fee: '400000000', existentialDeposit: '500000000', decimals: 12 }
  // }
};
