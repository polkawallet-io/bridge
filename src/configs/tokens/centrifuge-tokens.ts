import { FN, MultiChainToken } from '../../types';

export const altairTokensConfig: Record<string, MultiChainToken> = {
  AIR: { name: 'AIR',
    symbol: 'AIR',
    decimals: 18,
    ed: {
      altair: new FN('1000000000000'),
      karura: new FN('1000000000000')
    } }
};
