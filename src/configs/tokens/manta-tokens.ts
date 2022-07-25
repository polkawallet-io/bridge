import { BN } from '@polkadot/util';

import { MultiChainToken } from '../../types';

export const calamariTokensConfig: Record<string, MultiChainToken> = {
  KMA: { name: 'KMA',
    symbol: 'KMA',
    decimals: 12,
    ed: {
      calamari: new BN('100000000000'),
      karura: new BN('100000000000')
    } }
};
