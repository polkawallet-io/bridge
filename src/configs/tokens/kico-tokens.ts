import { FN, MultiChainToken } from '../../types';

export const kicoTokensConfig: Record<string, MultiChainToken> = {
  KICO: { name: 'KICO',
    symbol: 'KICO',
    decimals: 14,
    ed: {
      kico: new FN('100000000000000'),
      karura: new FN('100000000000000')
    } }
};
