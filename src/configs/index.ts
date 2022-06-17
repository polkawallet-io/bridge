import { Chain } from "../types";
import { kusamaChains } from "./kusama-chains";
import { polkadotChains } from "./polkadot-chains";

const data = {
  ...kusamaChains,
  ...polkadotChains,
};

export type RegisteredChainName = keyof typeof data;

export const chains = data as Record<RegisteredChainName, Chain>;
