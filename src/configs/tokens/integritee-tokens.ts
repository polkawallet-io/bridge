import { BN } from '@polkadot/util';

import { MultiChainToken } from '../../types';

export const integriteeTokensConfig: Record<string, MultiChainToken> = {
  TEER: { name: 'TEER',
    symbol: 'TEER',
    decimals: 12,
    ed: {
      integritee: new BN('100000000000'),
      karura: new BN('100000000000')
    } }
};
