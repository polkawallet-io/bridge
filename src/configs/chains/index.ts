import { Chain } from "../../types";
import { kusamaChains, kusamaTestnetChains } from "./kusama-chains";
import { polkadotChains, polkadotTestnetChains } from "./polkadot-chains";

export const rawChains =
  // TODO switch this to an enum
  process.env.network === "mainnet"
    ? {
        ...kusamaChains,
        ...polkadotChains,
      }
    : {
        ...kusamaTestnetChains,
        ...polkadotTestnetChains,
      };

export type ChainName = keyof typeof rawChains;

export const chains: Record<ChainName, Chain> = rawChains;
