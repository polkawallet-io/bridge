import { FN, MultiChainToken } from '../../types';

export const khalaTokensConfig: Record<string, MultiChainToken> = {
  PHA: { name: 'PHA',
    symbol: 'PHA',
    decimals: 12,
    ed: {
      khala: new FN('40000000000'),
      karura: new FN('40000000000')
    } }
};
