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
import { khalaRoutersConfig } from './khala-routers';
import { kicoRoutersConfig } from './kico-routers';
import { mantaRoutersConfig } from './manta-routers';
import { moonbeamRoutersConfig } from './moonbeam-routers';
import { parallelRoutersConfig } from './parallel-routers';
import { pichiuRoutersConfig } from './pichiu-routers';
import { polkadotRoutersConfig, statemineRoutersConfig } from './polkadot-routers';
import { turingRoutersConfig } from './turing-routers';
import { uniqueRoutersConfig } from './unique-routers';

export const routersConfig = {
  ...polkadotRoutersConfig,
  ...statemineRoutersConfig,
  ...acalaRoutersConfig,
  ...karuraRoutersConfig,
  ...bifrostRoutersConfig,
  ...uniqueRoutersConfig,
  ...interlayRoutersConfig,
  ...khalaRoutersConfig,
  ...kicoRoutersConfig,
  ...moonbeamRoutersConfig,
  ...parallelRoutersConfig,
  ...centrifugeRoutersConfig,
  ...darwiniaRoutersConfig,
  ...mantaRoutersConfig,
  ...crustRoutersConfig,
  ...integriteeRoutersConfig,
  ...turingRoutersConfig,
  ...astarRoutersConfig,
  ...pichiuRoutersConfig
} as Record<ChainName, Omit<CrossChainRouterConfigs, 'from'>[]>;
