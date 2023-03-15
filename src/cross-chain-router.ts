import { isEmpty, overEvery, uniqWith } from "lodash";

import { isChainEqual } from "./utils/is-chain-equal";
import { BaseCrossChainAdapter } from "./base-chain-adapter";
import { ChainId, chains } from "./configs";
import { Chain, CrossChainRouter, RouteConfigs, RouterFilter } from "./types";
import { fetchConfigFromApiOrLocal } from "./utils";

interface BridgeRouterManagerConfigs {
  adapters: BaseCrossChainAdapter[];
  disabledRouters?: RouterFilter[] | string;
}

export class BridgeRouterManager {
  private routers: CrossChainRouter[];
  private adapters: BaseCrossChainAdapter[];
  public disabledRouters: RouterFilter[] = [];
  private configs?: BridgeRouterManagerConfigs;

  constructor(configs?: BridgeRouterManagerConfigs) {
    this.routers = [];
    this.adapters = configs?.adapters || [];
    this.configs = configs;
  }

  public async init() {
    if (this.configs?.disabledRouters) {
      try {
        const disabledRouters = await fetchConfigFromApiOrLocal(
          this.configs.disabledRouters,
          (i: any) => i.disabledRoute
        );
        this.disabledRouters = disabledRouters;
      } catch (e) {
        return false;
      }
    }

    return true;
  }

  public findAdapterByName(
    chain: ChainId | Chain
  ): BaseCrossChainAdapter | undefined {
    return this.adapters.find((i) => isChainEqual(chain, i.chain));
  }

  public addRouter(router: RouteConfigs, checkAdapter = true) {
    const { token, xcm } = router;
    const from =
      typeof router.from === "string" ? chains[router.from] : router.from;
    const to = typeof router.to === "string" ? chains[router.to] : router.to;

    // push routers if from adapter is set
    if (!checkAdapter || (this.findAdapterByName(from) && checkAdapter)) {
      this.routers.push({ from, to, token, xcm });
    }
  }

  public addRouters(routers: RouteConfigs[], checkAdapter = true) {
    routers.map((i) => this.addRouter(i, checkAdapter));
  }

  public getRouters(params?: RouterFilter): CrossChainRouter[] {
    // return all router configs when params is empty
    if (!params || isEmpty(params)) {
      return this.routers;
    }

    const compares = overEvery(
      Object.entries(params)
        .map(([k, v]): undefined | ((i: CrossChainRouter) => boolean) => {
          switch (k) {
            case "from":
              return (i: CrossChainRouter) => isChainEqual(i.from, v);
            case "to":
              return (i: CrossChainRouter) => isChainEqual(i.to, v);

            case "token": {
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
  public getAvailableRouters(): CrossChainRouter[] {
    return this.routers.filter(
      (e) =>
        !this.disabledRouters.find(
          (i) =>
            i.from === e.from.id &&
            i.to === e.to.id &&
            (!i.token || i.token === e.token)
        )
    );
  }

  public getDestinationChains(params: Omit<RouterFilter, "to">): Chain[] {
    if (isEmpty(params)) {
      return [];
    }

    return uniqWith(
      this.getRouters(params).map((i) => i.to),
      (i, j) => isChainEqual(i, j)
    );
  }

  public getFromChains(params: Omit<RouterFilter, "from">): Chain[] {
    if (isEmpty(params)) {
      return [];
    }

    return uniqWith(
      this.getRouters(params).map((i) => i.from),
      (i, j) => isChainEqual(i, j)
    );
  }

  public getAvailableTokens(params: Omit<RouterFilter, "token">): string[] {
    if (isEmpty(params)) {
      return [];
    }

    return uniqWith(
      this.getRouters(params).map((i) => i.token),
      (i, j) => i === j
    );
  }
}
