import { BN } from '@polkadot/util';

import { CrossChainRouterConfigs, FN } from '../../types';

export const uniqueRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  quartz: [
    { to: 'karura', token: 'QTZ', xcm: { fee: { token: 'QTZ', balance: FN.fromInner('64000000000000000', 18) }, weightLimit: new BN(5_000_000_000) } }
  ]
  // quartz: {
  //   QTZ: { fee: '0', existentialDeposit: '1000000000000000000', decimals: 18 }
  // }
};
