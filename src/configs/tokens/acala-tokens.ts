import { BN } from '@polkadot/util';

import { MultiChainToken } from '../../types';

export const acalaTokensConfig: Record<string, MultiChainToken> = {
  ACA: { name: 'ACA',
    symbol: 'ACA',
    decimals: 12,
    ed: {
      acala: new BN('100000000000'),
      moonbeam: new BN('100000000000'),
      parallel: new BN('100000000000')
    } },
  AUSD: { name: 'AUSD',
    symbol: 'AUSD',
    decimals: 12,
    ed: {
      acala: new BN('100000000000'),
      moonbeam: new BN('100000000000'),
      parallel: new BN('100000000000')
    } },
  LDOT: { name: 'LDOT',
    symbol: 'LDOT',
    decimals: 10,
    ed: {
      acala: new BN('500000000'),
      parallel: new BN('500000000')
    } }
};

export const karuraTokensConfig: Record<string, MultiChainToken> = {
  KAR: { name: 'KAR',
    symbol: 'KAR',
    decimals: 12,
    ed: {
      karura: new BN('100000000000'),
      bifrost: new BN('148000000'),
      khala: new BN('10000000000'),
      heiko: new BN('0'),
      moonriver: new BN('0'),
      kico: new BN('0'),
      calamari: new BN('100000000000'),
      turing: new BN('100000000000'),
      pichiu: new BN('100000000000')
    } },
  KUSD: { name: 'KUSD',
    symbol: 'KUSD',
    decimals: 12,
    ed: {
      karura: new BN('10000000000'),
      bifrost: new BN('100000000'),
      khala: new BN('10000000000'),
      heiko: new BN('0'),
      moonriver: new BN('0'),
      kico: new BN('0'),
      calamari: new BN('10000000000'),
      altair: new BN('100000000000'),
      turing: new BN('10000000000'),
      pichiu: new BN('10000000000'),
      shiden: new BN('1')
    } },
  LKSM: { name: 'LKSM',
    symbol: 'LKSM',
    decimals: 12,
    ed: {
      karura: new BN('500000000'),
      heiko: new BN('0'),
      calamari: new BN('500000000'),
      turing: new BN('500000000'),
      pichiu: new BN('500000000')
    } }
};
