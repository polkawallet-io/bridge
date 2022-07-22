import { FN, MultiChainToken } from '../../types';

export const crabTokensConfig: Record<string, MultiChainToken> = {
  CRAB: { name: 'CRAB',
    symbol: 'CRAB',
    decimals: 18,
    ed: {
      crab: new FN('0'),
      karura: new FN('1000000000000000000')
    } }
};
