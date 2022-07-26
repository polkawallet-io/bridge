import { BN } from '@polkadot/util';

import { MultiChainToken } from '../../types';

export const parallelTokensConfig: Record<string, MultiChainToken> = {
  PARA: { name: 'PARA',
    symbol: 'PARA',
    decimals: 12,
    ed: {
      parallel: new BN('100000000000'),
      acala: new BN('100000000000')
    } }
};

export const heikoTokensConfig: Record<string, MultiChainToken> = {
  HKO: { name: 'HKO',
    symbol: 'HKO',
    decimals: 12,
    ed: {
      heiko: new BN('100000000000'),
      karura: new BN('100000000000')
    } }
};
