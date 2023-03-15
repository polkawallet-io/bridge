import { Chain } from "../../types";
import { kusamaChains } from "./kusama-chains";
import { polkadotChains } from "./polkadot-chains";

export const rawChains = {
  ...kusamaChains,
  ...polkadotChains,
};

export type ChainId = keyof typeof rawChains;

export const chains = Object.fromEntries(
  Object.entries(rawChains).map(([id, data]) => {
    return [id, { id, ...data }];
  })
) as { [k in ChainId]: Chain };
