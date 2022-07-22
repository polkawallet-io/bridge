import { FN, MultiChainToken } from '../../types';

export const acalaTokensConfig: Record<string, MultiChainToken> = {
  ACA: { name: 'ACA',
    symbol: 'ACA',
    decimals: 12,
    ed: {
      acala: new FN('100000000000'),
      moonbeam: new FN('100000000000'),
      parallel: new FN('100000000000')
    } },
  AUSD: { name: 'AUSD',
    symbol: 'AUSD',
    decimals: 12,
    ed: {
      acala: new FN('100000000000'),
      moonbeam: new FN('100000000000'),
      parallel: new FN('100000000000')
    } },
  LDOT: { name: 'LDOT',
    symbol: 'LDOT',
    decimals: 10,
    ed: {
      acala: new FN('500000000'),
      parallel: new FN('500000000')
    } }
};

export const karuraTokensConfig: Record<string, MultiChainToken> = {
  KAR: { name: 'KAR',
    symbol: 'KAR',
    decimals: 12,
    ed: {
      karura: new FN('100000000000'),
      bifrost: new FN('148000000'),
      khala: new FN('10000000000'),
      heiko: new FN('0'),
      moonriver: new FN('0'),
      kico: new FN('0'),
      calamari: new FN('100000000000'),
      turing: new FN('100000000000'),
      pichiu: new FN('100000000000')
    } },
  KUSD: { name: 'KUSD',
    symbol: 'KUSD',
    decimals: 12,
    ed: {
      karura: new FN('10000000000'),
      bifrost: new FN('100000000'),
      khala: new FN('10000000000'),
      heiko: new FN('0'),
      moonriver: new FN('0'),
      kico: new FN('0'),
      calamari: new FN('10000000000'),
      altair: new FN('100000000000'),
      turing: new FN('10000000000'),
      pichiu: new FN('10000000000'),
      shiden: new FN('1')
    } },
  LKSM: { name: 'LKSM',
    symbol: 'LKSM',
    decimals: 12,
    ed: {
      karura: new FN('500000000'),
      heiko: new FN('0'),
      calamari: new FN('500000000'),
      turing: new FN('500000000'),
      pichiu: new FN('500000000')
    } }
};
