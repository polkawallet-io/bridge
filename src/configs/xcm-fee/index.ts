import { RegisteredChainName } from "..";
import { CrossChainFeeConfig } from "../../types";
import { polkadotXcmFeeConfig, statemineXcmFeeConfig } from "./polkadot-fee";
import { acalaXcmFeeConfig, karuraXcmFeeConfig } from "./acala-fee";
import { centrifugeXcmFeeConfig } from "./centrifuge-fee";
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
import { astarXcmFeeConfig } from "./astar-fee";
import { pichiuXcmFeeConfig } from "./pichiu-fee";

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
  ...centrifugeXcmFeeConfig,
  ...darwiniaXcmFeeConfig,
  ...calamariXcmFeeConfig,
  ...crustXcmFeeConfig,
  ...integriteeXcmFeeConfig,
  ...turingXcmFeeConfig,
  ...astarXcmFeeConfig,
  ...pichiuXcmFeeConfig,
} as Record<RegisteredChainName, Record<string, CrossChainFeeConfig>>;
