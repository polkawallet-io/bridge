import { BN } from '@polkadot/util';

import { MultiChainToken } from '../../types';

export const shidenTokensConfig: Record<string, MultiChainToken> = {
  SDN: { name: 'SDN',
    symbol: 'SDN',
    decimals: 18,
    ed: {
      shiden: new BN('1000000'),
      karura: new BN('10000000000000000')
    } }
};
