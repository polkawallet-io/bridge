import { ChainType } from 'src/types';

const typeSubstrate: ChainType = 'substrate';
const typeEthereum: ChainType = 'ethereum';

export const polkadotChains = {
  polkadot: {
    id: 'polkadot',
    display: 'Polkadot',
    type: typeSubstrate,
    icon: 'https://resources.acala.network/networks/polkadot.png',
    paraChainId: -1,
    ss58Prefix: 0
  },
  statemint: {
    id: 'statemint',
    display: 'Statemint',
    type: typeSubstrate,
    icon: 'https://resources.acala.network/networks/statemine.png',
    paraChainId: 1000,
    ss58Prefix: 0
  },
  acala: {
    id: 'acala',
    display: 'Acala',
    type: typeSubstrate,
    icon: 'https://resources.acala.network/networks/acala.png',
    paraChainId: 2000,
    ss58Prefix: 10
  },
  parallel: {
    id: 'parallel',
    display: 'Parallel',
    type: typeSubstrate,
    icon: 'https://resources.acala.network/networks/parallel.png',
    paraChainId: 2012,
    ss58Prefix: 172
  },
  moonbeam: {
    id: 'moonbeam',
    display: 'Moonbeam',
    type: typeEthereum,
    icon: 'https://resources.acala.network/networks/moonbeam.png',
    paraChainId: 2004,
    ss58Prefix: 1284
  },
  interlay: {
    id: 'interlay',
    display: 'Interlay',
    type: typeSubstrate,
    icon: 'https://resources.acala.network/networks/interlay.png',
    paraChainId: 2032,
    ss58Prefix: 2032
  }
};
