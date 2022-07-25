import { BN } from '@polkadot/util';

import { MultiChainToken } from '../../types';

export const quartzTokensConfig: Record<string, MultiChainToken> = {
  QTZ: { name: 'QTZ',
    symbol: 'QTZ',
    decimals: 18,
    ed: {
      quartz: new BN('1000000000000000000'),
      karura: new BN('40000000000')
    } }
};
