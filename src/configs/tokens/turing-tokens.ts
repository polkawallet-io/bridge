import { FN, MultiChainToken } from '../../types';

export const turingTokensConfig: Record<string, MultiChainToken> = {
  TUR: { name: 'TUR',
    symbol: 'TUR',
    decimals: 10,
    ed: {
      turing: new FN('100000000'),
      karura: new FN('40000000000')
    } }
};
