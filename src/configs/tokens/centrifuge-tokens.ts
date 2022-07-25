import { BN } from '@polkadot/util';

import { MultiChainToken } from '../../types';

export const altairTokensConfig: Record<string, MultiChainToken> = {
  AIR: { name: 'AIR',
    symbol: 'AIR',
    decimals: 18,
    ed: {
      altair: new BN('1000000000000'),
      karura: new BN('1000000000000')
    } }
};
