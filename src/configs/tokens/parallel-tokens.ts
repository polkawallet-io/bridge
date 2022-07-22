import { FN, MultiChainToken } from '../../types';

export const parallelTokensConfig: Record<string, MultiChainToken> = {
  PARA: { name: 'PARA',
    symbol: 'PARA',
    decimals: 12,
    ed: {
      parallel: new FN('100000000000'),
      acala: new FN('100000000000')
    } }
};

export const heikoTokensConfig: Record<string, MultiChainToken> = {
  HKO: { name: 'HKO',
    symbol: 'HKO',
    decimals: 12,
    ed: {
      heiko: new FN('100000000000'),
      karura: new FN('100000000000')
    } }
};
