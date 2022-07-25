import { BN } from '@polkadot/util';

import { CrossChainRouterConfigs, FN } from '../../types';

export const parallelRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  heiko: [
    { to: 'karura', token: 'HKO', xcm: { fee: { token: 'HKO', balance: FN.fromInner('6400000000', 12) }, weightLimit: new BN(5_000_000_000) } }
  ],
  parallel: [
    { to: 'karura', token: 'PARA', xcm: { fee: { token: 'PARA', balance: FN.fromInner('6400000000', 12) }, weightLimit: new BN(5_000_000_000) } }
  ]
  // heiko: {
  //   HKO: { fee: '1440000000', existentialDeposit: '100000000000', decimals: 12 },
  //   KAR: { fee: '2400000000', existentialDeposit: '0', decimals: 12 },
  //   KUSD: { fee: '19200000000', existentialDeposit: '0', decimals: 12 },
  //   LKSM: { fee: '48000000', existentialDeposit: '0', decimals: 12 }
  // },
  // parallel: {
  //   PARA: { fee: '9600000000', existentialDeposit: '100000000000', decimals: 12 },
  //   ACA: { fee: '1920000000', existentialDeposit: '100000000000', decimals: 12 },
  //   AUSD: { fee: '2880000000', existentialDeposit: '100000000000', decimals: 12 },
  //   LDOT: { fee: '96000000', existentialDeposit: '500000000', decimals: 10 }
  // }
};
