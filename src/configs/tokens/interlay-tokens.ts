import { FN, MultiChainToken } from '../../types';

export const interlayTokensConfig: Record<string, MultiChainToken> = {
  INTR: { name: 'INTR',
    symbol: 'INTR',
    decimals: 10,
    ed: {
      interlay: new FN('0'),
      acala: new FN('1000000000')
    } },
  IBCT: { name: 'IBCT',
    symbol: 'IBCT',
    decimals: 8,
    ed: {
      interlay: new FN('0'),
      acala: new FN('0')
    } }
};

export const kintsugiTokensConfig: Record<string, MultiChainToken> = {
  KINT: { name: 'KINT',
    symbol: 'KINT',
    decimals: 12,
    ed: {
      kintsugi: new FN('0'),
      karura: new FN('0')
    } },
  KBTC: { name: 'KBTC',
    symbol: 'KBTC',
    decimals: 8,
    ed: {
      kintsugi: new FN('0'),
      karura: new FN('0')
    } }
};
