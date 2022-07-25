import { BN } from '@polkadot/util';

import { CrossChainRouterConfigs, FN } from '../../types';

export const khalaRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  khala: [
    { to: 'karura', token: 'PHA', xcm: { fee: { token: 'PHA', balance: FN.fromInner('51200000000', 12) }, weightLimit: new BN(5_000_000_000) } }
  ]
  // khala: {
  //   PHA: { fee: '64000000000', existentialDeposit: '40000000000', decimals: 12 },
  //   KUSD: { fee: '16000000000', existentialDeposit: '10000000000', decimals: 12 },
  //   KAR: { fee: '8000000000', existentialDeposit: '10000000000', decimals: 12 }
  // }
};
