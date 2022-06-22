import { Chain, CrossChainFeeConfig } from "../types";
import { kusamaChains } from "./kusama-chains";
import { polkadotChains } from "./polkadot-chains";
import { kusamaXcmFeeConfig, kusamaCommonXcmFeeConfig } from "./kusama-xcm-fee";

const chainsAll = {
  ...kusamaChains,
  ...polkadotChains,
};

export type RegisteredChainName = keyof typeof chainsAll;

export const chains = chainsAll as Record<RegisteredChainName, Chain>;

export const xcmFeeConfig = { ...kusamaXcmFeeConfig, ...kusamaCommonXcmFeeConfig } as Record<
  RegisteredChainName,
  Record<string, CrossChainFeeConfig>
>;
