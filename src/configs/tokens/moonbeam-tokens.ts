import { BN } from '@polkadot/util';

import { MultiChainToken } from '../../types';

export const moonbeamTokensConfig: Record<string, MultiChainToken> = {
  GLMR: { name: 'GLMR',
    symbol: 'GLMR',
    decimals: 18,
    ed: {
      moonbeam: new BN('100000000000000000'),
      acala: new BN('100000000000000000')
    } }
};

export const moonriverTokensConfig: Record<string, MultiChainToken> = {
  MOVR: { name: 'MOVR',
    symbol: 'MOVR',
    decimals: 18,
    ed: {
      moonriver: new BN('1000000000000000'),
      karura: new BN('1000000000000000')
    } }
};
