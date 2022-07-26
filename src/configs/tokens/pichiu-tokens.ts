import { BN } from '@polkadot/util';

import { MultiChainToken } from '../../types';

export const pichiuTokensConfig: Record<string, MultiChainToken> = {
  PCHU: { name: 'PCHU',
    symbol: 'PCHU',
    decimals: 18,
    ed: {
      pichiu: new BN('1000000000000'),
      karura: new BN('100000000000000000')
    } }
};
