import { FN, MultiChainToken } from '../../types';

export const integriteeTokensConfig: Record<string, MultiChainToken> = {
  TEER: { name: 'TEER',
    symbol: 'TEER',
    decimals: 12,
    ed: {
      integritee: new FN('100000000000'),
      karura: new FN('100000000000')
    } }
};
