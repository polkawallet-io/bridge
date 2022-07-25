import { BN } from '@polkadot/util';

import { MultiChainToken } from '../../types';

export const shadowTokensConfig: Record<string, MultiChainToken> = {
  CSM: { name: 'CSM',
    symbol: 'CSM',
    decimals: 12,
    ed: {
      shadow: new BN('1000000000000'),
      karura: new BN('1000000000000')
    } }
};
