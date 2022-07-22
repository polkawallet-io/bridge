import { FN, MultiChainToken } from '../../types';

export const shidenTokensConfig: Record<string, MultiChainToken> = {
  SDN: { name: 'SDN',
    symbol: 'SDN',
    decimals: 18,
    ed: {
      shiden: new FN('1000000'),
      karura: new FN('10000000000000000')
    } }
};
