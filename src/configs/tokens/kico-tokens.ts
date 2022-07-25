import { BN } from '@polkadot/util';

import { MultiChainToken } from '../../types';

export const kicoTokensConfig: Record<string, MultiChainToken> = {
  KICO: { name: 'KICO',
    symbol: 'KICO',
    decimals: 14,
    ed: {
      kico: new BN('100000000000000'),
      karura: new BN('100000000000000')
    } }
};
