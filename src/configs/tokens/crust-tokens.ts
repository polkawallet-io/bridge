import { FN, MultiChainToken } from '../../types';

export const shadowTokensConfig: Record<string, MultiChainToken> = {
  CSM: { name: 'CSM',
    symbol: 'CSM',
    decimals: 12,
    ed: {
      shadow: new FN('1000000000000'),
      karura: new FN('1000000000000')
    } }
};
