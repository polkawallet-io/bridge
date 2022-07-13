import { RegisteredChainName } from "..";
import { CrossChainFeeConfig } from "../../types";
import { polkadotXcmFeeConfig, statemineXcmFeeConfig } from "./polkadot-fee";
import { acalaXcmFeeConfig, karuraXcmFeeConfig } from "./acala-fee";
import { altairXcmFeeConfig } from "./altair-fee";
import { bifrostXcmFeeConfig } from "./bifrost-fee";
import { calamariXcmFeeConfig } from "./calamari-fee";
import { crustXcmFeeConfig } from "./crust-fee";
import { integriteeXcmFeeConfig } from "./integritee-fee";
import { khalaXcmFeeConfig } from "./khala-fee";
import { kicoXcmFeeConfig } from "./kico-fee";
import { kintsugiXcmFeeConfig } from "./kintsugi-fee";
import { moonbeamXcmFeeConfig } from "./moonbeam-fee";
import { parallelXcmFeeConfig } from "./parallel-fee";
import { quartzXcmFeeConfig } from "./quartz-fee";
import { darwiniaXcmFeeConfig } from "./darwinia-fee";
import { turingXcmFeeConfig } from "./turing-fee";

export const xcmFeeConfig = {
  ...polkadotXcmFeeConfig,
  ...statemineXcmFeeConfig,
  ...acalaXcmFeeConfig,
  ...karuraXcmFeeConfig,
  ...bifrostXcmFeeConfig,
  ...quartzXcmFeeConfig,
  ...kintsugiXcmFeeConfig,
  ...khalaXcmFeeConfig,
  ...kicoXcmFeeConfig,
  ...moonbeamXcmFeeConfig,
  ...parallelXcmFeeConfig,
  ...altairXcmFeeConfig,
  ...darwiniaXcmFeeConfig,
  ...calamariXcmFeeConfig,
  ...crustXcmFeeConfig,
  ...integriteeXcmFeeConfig,
  ...turingXcmFeeConfig,
} as Record<RegisteredChainName, Record<string, CrossChainFeeConfig>>;
