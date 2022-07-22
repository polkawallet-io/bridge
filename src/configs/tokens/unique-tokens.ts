import { FN, MultiChainToken } from '../../types';

export const quartzTokensConfig: Record<string, MultiChainToken> = {
  QTZ: { name: 'QTZ',
    symbol: 'QTZ',
    decimals: 18,
    ed: {
      quartz: new FN('1000000000000000000'),
      karura: new FN('40000000000')
    } }
};
