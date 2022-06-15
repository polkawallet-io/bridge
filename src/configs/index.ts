import { Chain } from "../types";
import { kusamaChains } from "./kusama";
import { polkadotChains } from "./polkadot";

const data = {
  ...kusamaChains,
  ...polkadotChains,
};

export type RegisteredChain = keyof typeof data;

export const chains = data as Record<RegisteredChain, Chain>;
