import { FN, MultiChainToken } from '../../types';

export const calamariTokensConfig: Record<string, MultiChainToken> = {
  KMA: { name: 'KMA',
    symbol: 'KMA',
    decimals: 12,
    ed: {
      calamari: new FN('100000000000'),
      karura: new FN('100000000000')
    } }
};
