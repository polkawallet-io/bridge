import { BN } from '@polkadot/util';

import { CrossChainRouterConfigs, FN } from '../../types';

export const astarRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  shiden: [
    { to: 'karura', token: 'SDN', xcm: { fee: { token: 'SDN', balance: FN.fromInner('932400000000000', 18) }, weightLimit: new BN(5_000_000_000) } }
  ]
  // shiden: {
  //   SDN: { fee: '4662276356431024', existentialDeposit: '1000000', decimals: 18 },
  //   KUSD: { fee: '1200000000', existentialDeposit: '1', decimals: 12 }
  // }
};
