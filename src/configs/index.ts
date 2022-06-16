import { Chain } from "../types";
import { kusamaChains } from "./kusama-chains";
import { polkadotChains } from "./polkadot-chains";

const data = {
  ...kusamaChains,
  ...polkadotChains,
};

export type RegisteredChain = keyof typeof data;

export const chains = data as Record<RegisteredChain, Chain>;
