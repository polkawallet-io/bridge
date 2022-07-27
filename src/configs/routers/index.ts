import { CrossChainRouterConfigs } from '../../types';
import { ChainName } from '..';
import { acalaRoutersConfig, karuraRoutersConfig } from './acala-routers';
import { astarRoutersConfig } from './astar-routers';
import { bifrostRoutersConfig } from './bifrost-routers';
import { centrifugeRoutersConfig } from './centrifuge-routers';
import { crustRoutersConfig } from './crust-routers';
import { darwiniaRoutersConfig } from './darwinia-routers';
import { integriteeRoutersConfig } from './integritee-routers';
import { interlayRoutersConfig } from './interlay-routers';
import { kicoRoutersConfig } from './kico-routers';
import { kylinRoutersConfig } from './kylin-routers';
import { mantaRoutersConfig } from './manta-routers';
import { oakRoutersConfig } from './oak-routers';
import { parallelRoutersConfig } from './parallel-routers';
import { phalaRoutersConfig } from './phala-routers';
import { polkadotRoutersConfig, statemineRoutersConfig } from './polkadot-routers';
import { uniqueRoutersConfig } from './unique-routers';

export const routersConfig = {
  ...polkadotRoutersConfig,
  ...statemineRoutersConfig,
  ...acalaRoutersConfig,
  ...karuraRoutersConfig,
  ...bifrostRoutersConfig,
  ...uniqueRoutersConfig,
  ...interlayRoutersConfig,
  ...phalaRoutersConfig,
  ...kicoRoutersConfig,
  ...parallelRoutersConfig,
  ...centrifugeRoutersConfig,
  ...darwiniaRoutersConfig,
  ...mantaRoutersConfig,
  ...crustRoutersConfig,
  ...integriteeRoutersConfig,
  ...oakRoutersConfig,
  ...astarRoutersConfig,
  ...kylinRoutersConfig
} as Record<ChainName, Omit<CrossChainRouterConfigs, 'from'>[]>;
