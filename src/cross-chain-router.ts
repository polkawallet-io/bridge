import axios from 'axios';
import { isEmpty, overEvery, uniqWith } from 'lodash';

import { isChainEqual } from './utils/is-chain-equal';
import { BaseCrossChainAdapter } from './base-chain-adapter';
import { chains, RegisteredChainName } from './configs';
import { Chain, CrossChainRouter } from './types';

const CONFIG_URL = 'https://api.polkawallet.io/devConfiguration/config/bridge.json';

interface RouterFilter {
  from?: Chain | RegisteredChainName;
  to?: Chain | RegisteredChainName;
  token?: string;
}

interface BridgeRouterManagerConfigs {
  adapters: BaseCrossChainAdapter[];
}

export class BridgeRouterManager {
  private routers: CrossChainRouter[];
  private routersDisabled: RouterFilter[];
  private adapters: BaseCrossChainAdapter[];

  constructor (configs?: BridgeRouterManagerConfigs) {
    this.routers = [];
    this.routersDisabled = [];
    this.adapters = configs?.adapters || [];
  }

  public async updateDisabledRouters () {
    const { data } = await axios.get(CONFIG_URL);

    this.routersDisabled = data.disabledRoute as RouterFilter[];
  }

  public findAdapterByName (chain: RegisteredChainName | Chain): BaseCrossChainAdapter | undefined {
    return this.adapters.find((i) => isChainEqual(chain, i.chain));
  }

  public async addRouter (router: CrossChainRouter, checkAdapter = true): Promise<void> {
    const { token } = router;
    const from = typeof router.from === 'string' ? chains[router.from] : router.from;
    const to = typeof router.to === 'string' ? chains[router.to] : router.to;

    // push routers if from adapter is set
    if (!checkAdapter || (this.findAdapterByName(from) && checkAdapter)) {
      this.routers.push({ from, to, token });
    }
  }

  public async addRouters (routers: CrossChainRouter[], checkAdapter = true): Promise<void> {
    await Promise.all(routers.map((i) => this.addRouter(i, checkAdapter)));
  }

  public getRouters (params?: RouterFilter): CrossChainRouter[] {
    // return all router configs when params is empty
    if (!params || isEmpty(params)) {
      return this.routers;
    }

    const compares = overEvery(
      Object.entries(params)
        .map(([k, v]): undefined | ((i: CrossChainRouter) => boolean) => {
          switch (k) {
            case 'from':
              return (i: CrossChainRouter) => isChainEqual(i.from, v);
            case 'to':
              return (i: CrossChainRouter) => isChainEqual(i.to, v);

            case 'token': {
              return (i: CrossChainRouter) => i.token === v;
            }
          }

          return undefined;
        })
        .filter((i) => !!i) as ((i: CrossChainRouter) => boolean)[]
    );

    return this.routers.filter((i) => compares(i));
  }

  // filter routers with disabled list from config
  public getAvailableRouters (): CrossChainRouter[] {
    return this.routers.filter((e) => !this.routersDisabled.find((i) => i.from === e.from.id && i.to === e.to.id && (!i.token || i.token === e.token)));
  }

  public getDestiantionsChains (params: Omit<RouterFilter, 'to'>): Chain[] {
    if (isEmpty(params)) {
      return [];
    }

    return uniqWith(
      this.getRouters(params).map((i) => i.to),
      (i, j) => isChainEqual(i, j)
    );
  }

  public getFromChains (params: Omit<RouterFilter, 'from'>): Chain[] {
    if (isEmpty(params)) {
      return [];
    }

    return uniqWith(
      this.getRouters(params).map((i) => i.from),
      (i, j) => isChainEqual(i, j)
    );
  }

  public getAvailableTokens (params: Omit<RouterFilter, 'token'>): string[] {
    if (isEmpty(params)) {
      return [];
    }

    return uniqWith(
      this.getRouters(params).map((i) => i.token),
      (i, j) => i === j
    );
  }
}
