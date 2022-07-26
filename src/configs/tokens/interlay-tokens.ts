import { BN } from '@polkadot/util';

import { MultiChainToken } from '../../types';

export const interlayTokensConfig: Record<string, MultiChainToken> = {
  INTR: { name: 'INTR',
    symbol: 'INTR',
    decimals: 10,
    ed: {
      interlay: new BN('0'),
      acala: new BN('1000000000')
    } },
  IBCT: { name: 'IBCT',
    symbol: 'IBCT',
    decimals: 8,
    ed: {
      interlay: new BN('0'),
      acala: new BN('100')
    } }
};

export const kintsugiTokensConfig: Record<string, MultiChainToken> = {
  KINT: { name: 'KINT',
    symbol: 'KINT',
    decimals: 12,
    ed: {
      kintsugi: new BN('0'),
      karura: new BN('133330000')
    } },
  KBTC: { name: 'KBTC',
    symbol: 'KBTC',
    decimals: 8,
    ed: {
      kintsugi: new BN('0'),
      karura: new BN('66')
    } }
};
