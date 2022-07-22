import { FN, MultiChainToken } from '../../types';

export const pichiuTokensConfig: Record<string, MultiChainToken> = {
  PCHU: { name: 'PCHU',
    symbol: 'PCHU',
    decimals: 18,
    ed: {
      pichiu: new FN('1000000000000'),
      karura: new FN('100000000000000000')
    } }
};
