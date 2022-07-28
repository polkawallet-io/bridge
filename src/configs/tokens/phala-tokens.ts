import { BN } from '@polkadot/util';

import { MultiChainToken } from '../../types';

export const phalaTokensConfig: Record<string, MultiChainToken> = {
  PHA: { name: 'PHA',
    symbol: 'PHA',
    decimals: 12,
    ed: {
      khala: new BN('40000000000'),
      karura: new BN('40000000000')
    } }
};
