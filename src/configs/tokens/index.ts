import { acalaTokensConfig, karuraTokensConfig } from './acala-tokens';
import { shidenTokensConfig } from './astar-tokens';
import { bifrostTokensConfig } from './bifrost-tokens';
import { altairTokensConfig } from './centrifuge-tokens';
import { shadowTokensConfig } from './crust-tokens';
import { crabTokensConfig } from './darwinia-tokens';
import { integriteeTokensConfig } from './integritee-tokens';
import { interlayTokensConfig, kintsugiTokensConfig } from './interlay-tokens';
import { kicoTokensConfig } from './kico-tokens';
import { kylinTokensConfig } from './kylin-tokens';
import { calamariTokensConfig } from './manta-tokens';
import { moonbeamTokensConfig, moonriverTokensConfig } from './moonbeam-tokens';
import { oakTokensConfig } from './oak-tokens';
import { heikoTokensConfig, parallelTokensConfig } from './parallel-tokens';
import { phalaTokensConfig } from './phala-tokens';
import { polkadotTokensConfig, statemintTokensConfig } from './polkadot-tokens';
import { quartzTokensConfig } from './unique-tokens';

export const multiChainTokensConfig = {
  ...polkadotTokensConfig,
  ...statemintTokensConfig,
  ...acalaTokensConfig,
  ...karuraTokensConfig,
  ...shidenTokensConfig,
  ...bifrostTokensConfig,
  ...altairTokensConfig,
  ...shadowTokensConfig,
  ...crabTokensConfig,
  ...integriteeTokensConfig,
  ...interlayTokensConfig,
  ...kintsugiTokensConfig,
  ...phalaTokensConfig,
  ...kicoTokensConfig,
  ...calamariTokensConfig,
  ...moonbeamTokensConfig,
  ...moonriverTokensConfig,
  ...parallelTokensConfig,
  ...heikoTokensConfig,
  ...kylinTokensConfig,
  ...oakTokensConfig,
  ...quartzTokensConfig
};
