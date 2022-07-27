import { BN } from '@polkadot/util';

import { MultiChainToken } from '../../types';

export const oakTokensConfig: Record<string, MultiChainToken> = {
  TUR: { name: 'TUR',
    symbol: 'TUR',
    decimals: 10,
    ed: {
      turing: new BN('100000000'),
      karura: new BN('40000000000')
    } }
};
