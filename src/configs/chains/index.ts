import { Chain } from '../../types';
import { kusamaChains } from './kusama-chains';
import { polkadotChains } from './polkadot-chains';

export const rawChains = {
  ...kusamaChains,
  ...polkadotChains
};

export type ChainName = keyof typeof rawChains;

export const chains = rawChains as Record<ChainName, Chain>;
