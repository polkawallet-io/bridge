import { BN, BN_ZERO } from '@polkadot/util';

import { MultiChainToken } from '../../types';

export const crabTokensConfig: Record<string, MultiChainToken> = {
  CRAB: { name: 'CRAB',
    symbol: 'CRAB',
    decimals: 18,
    ed: {
      crab: BN_ZERO,
      karura: new BN('1000000000000000000')
    } }
};
