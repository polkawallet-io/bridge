import { ChainType } from 'src/types';

const typeSubstrate: ChainType = 'substrate';
const typeEthereum: ChainType = 'ethereum';

export const kusamaChains = {
  kusama: {
    id: 'kusama',
    display: 'Kusama',
    type: typeSubstrate,
    icon: 'https://resources.acala.network/networks/kusama.png',
    paraChainId: -1,
    ss58Prefix: 2
  },
  statemine: {
    id: 'statemine',
    display: 'Statemine',
    type: typeSubstrate,
    icon: 'https://resources.acala.network/networks/statemine.png',
    paraChainId: 1000,
    ss58Prefix: 2
  },
  karura: {
    id: 'karura',
    display: 'Karura',
    type: typeSubstrate,
    icon: 'https://resources.acala.network/networks/karura.png',
    paraChainId: 2000,
    ss58Prefix: 8
  },
  quartz: {
    id: 'quartz',
    display: 'Quartz',
    type: typeSubstrate,
    icon: 'https://resources.acala.network/networks/quartz.png',
    paraChainId: 2095,
    ss58Prefix: 255
  },
  bifrost: {
    id: 'bifrost',
    display: 'Bifrost',
    type: typeSubstrate,
    icon: 'https://resources.acala.network/networks/bifrost.png',
    paraChainId: 2001,
    ss58Prefix: 6
  },
  khala: {
    id: 'khala',
    display: 'Khala',
    type: typeSubstrate,
    icon: 'https://resources.acala.network/networks/khala.png',
    paraChainId: 2004,
    ss58Prefix: 30
  },
  kintsugi: {
    id: 'kintsugi',
    display: 'Kintsugi',
    type: typeSubstrate,
    icon: 'https://resources.acala.network/networks/kintsugi.png',
    paraChainId: 2092,
    ss58Prefix: 2092
  },
  moonriver: {
    id: 'moonriver',
    display: 'Moonriver',
    type: typeEthereum,
    icon: 'https://resources.acala.network/networks/moonriver.png',
    paraChainId: 2023,
    ss58Prefix: 1285
  },
  heiko: {
    id: 'heiko',
    display: 'Parallel Heiko',
    type: typeSubstrate,
    icon: 'https://resources.acala.network/networks/parallel.png',
    paraChainId: 2085,
    ss58Prefix: 110
  },
  kico: {
    id: 'kico',
    display: 'KICO',
    type: typeSubstrate,
    icon: 'https://resources.acala.network/networks/kico.png',
    paraChainId: 2107,
    ss58Prefix: 42
  },
  shadow: {
    id: 'shadow',
    display: 'Crust Shadow',
    type: typeSubstrate,
    icon: 'https://resources.acala.network/networks/crust shadow.png',
    paraChainId: 2012,
    ss58Prefix: 66
  },
  calamari: {
    id: 'calamari',
    display: 'Calamari',
    type: typeSubstrate,
    icon: 'https://resources.acala.network/networks/calamari.png',
    paraChainId: 2084,
    ss58Prefix: 78
  },
  integritee: {
    id: 'integritee',
    display: 'Integritee',
    type: typeSubstrate,
    icon: 'https://resources.acala.network/networks/integritee.png',
    paraChainId: 2015,
    ss58Prefix: 13
  },
  altair: {
    id: 'altair',
    display: 'Altair',
    type: typeSubstrate,
    icon: 'https://resources.acala.network/networks/altair.png',
    paraChainId: 2088,
    ss58Prefix: 136
  },
  crab: {
    id: 'crab',
    display: 'Darwinia Crab',
    type: typeSubstrate,
    icon: 'https://resources.acala.network/networks/crab.png',
    paraChainId: 2105,
    ss58Prefix: 42
  },
  turing: {
    id: 'turing',
    display: 'Turing',
    type: typeSubstrate,
    icon: 'https://resources.acala.network/networks/turing.png',
    paraChainId: 2114,
    ss58Prefix: 51
  },
  shiden: {
    id: 'shiden',
    display: 'Shiden',
    type: typeSubstrate,
    icon: 'https://resources.acala.network/networks/shiden.png',
    paraChainId: 2007,
    ss58Prefix: 5
  },
  pichiu: {
    id: 'pichiu',
    display: 'Pichiu',
    type: typeSubstrate,
    icon: 'https://resources.acala.network/networks/pichiu.png',
    paraChainId: 2102,
    ss58Prefix: 42
  },
  basilisk: {
    id: 'basilisk',
    display: 'Basilisk',
    type: typeSubstrate,
    icon: 'https://resources.acala.network/networks/basilisk.png',
    paraChainId: 2090,
    ss58Prefix: 10041
  },
  listen: {
    id: 'listen',
    display: 'Listen',
    type: typeSubstrate,
    icon: 'https://resources.acala.network/networks/listen.png',
    paraChainId: 2118,
    ss58Prefix: 42
  }
};
