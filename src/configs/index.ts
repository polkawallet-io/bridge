import { Chain } from '../types';
import { kusamaChains } from './kusama-chains';
import { polkadotChains } from './polkadot-chains';

const chainsAll = {
  ...kusamaChains,
  ...polkadotChains
};

export type RegisteredChainName = keyof typeof chainsAll;

export const chains = chainsAll as Record<RegisteredChainName, Chain>;
