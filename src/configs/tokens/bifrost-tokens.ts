import { BN } from '@polkadot/util';

import { MultiChainToken } from '../../types';

export const bifrostTokensConfig: Record<string, MultiChainToken> = {
  BNC: { name: 'BNC',
    symbol: 'BNC',
    decimals: 12,
    ed: {
      bifrost: new BN('10000000000'),
      karura: new BN('10000000000')
    } },
  VSKSM: { name: 'VSKSM',
    symbol: 'VSKSM',
    decimals: 12,
    ed: {
      bifrost: new BN('100000000'),
      karura: new BN('100000000')
    } }
};
