import axios from "axios";
import { isEmpty, overEvery, uniqWith } from "lodash";

import { isChainEqual } from "./utils/is-chain-equal";
import { BaseCrossChainAdapter } from "./base-chain-adapter";
import { ChainName, chains } from "./configs";
import {
  Chain,
  CrossChainRouter,
  CrossChainRouterConfigs,
  RouterFilter,
} from "./types";

const CONFIG_URL =
  "https://api.polkawallet.io/devConfiguration/config/bridge.json";

interface BridgeRouterManagerConfigs {
  adapters: BaseCrossChainAdapter[];
  routersDisabled?: RouterFilter[];
}

export class BridgeRouterManager {
  private routers: CrossChainRouter[];
  private adapters: BaseCrossChainAdapter[];

  public routersDisabled: RouterFilter[];

  constructor(configs?: BridgeRouterManagerConfigs) {
    this.routers = [];
    this.adapters = configs?.adapters || [];

    this.routersDisabled = configs?.routersDisabled || [];
  }

  public async updateDisabledRouters() {
    const { data } = await axios.get(CONFIG_URL);

    this.routersDisabled = data.disabledRoute as RouterFilter[];
  }

  public findAdapterByName(
    chain: ChainName | Chain
  ): BaseCrossChainAdapter | undefined {
    return this.adapters.find((i) => isChainEqual(chain, i.chain));
  }

  public addRouter(router: CrossChainRouterConfigs, checkAdapter = true) {
    const { token, xcm } = router;
    const from =
      typeof router.from === "string" ? chains[router.from] : router.from;
    const to = typeof router.to === "string" ? chains[router.to] : router.to;

    // push routers if from adapter is set
    if (!checkAdapter || (this.findAdapterByName(from) && checkAdapter)) {
      this.routers.push({ from, to, token, xcm });
    }
  }

  public addRouters(routers: CrossChainRouterConfigs[], checkAdapter = true) {
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
        !this.routersDisabled.find(
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
