import { ApiRx, WsProvider } from "@polkadot/api";
import {
  prodParasKusama,
  prodRelayKusama,
  prodRelayPolkadot,
  prodParasPolkadot,
  prodParasKusamaCommon,
} from "@polkadot/apps-config/endpoints";
import { RegisteredChainName } from "./configs";

import { map, combineLatest, Observable, race } from "rxjs";
import { options } from "@acala-network/api";

export class ApiProvider {
  protected apis: Record<string, ApiRx> = {};

  public getApi(chainName: string) {
    return this.apis[chainName];
  }

  public connectFromChain(chainName: RegisteredChainName[]) {
    return combineLatest(
      chainName.map((chain) => {
        let nodes: string[];
        if (chain === "kusama") {
          nodes = Object.values(prodRelayKusama.providers).filter((e) => e.startsWith("wss://"));
        } else if (chain === "polkadot") {
          nodes = Object.values(prodRelayPolkadot.providers).filter((e) => e.startsWith("wss://"));
        } else if (chain === "statemine") {
          nodes = Object.values(prodParasKusamaCommon.find((e) => e.info === chain)?.providers || {}).filter((e) => e.startsWith("wss://"));
        } else {
          nodes = Object.values([...prodParasKusama, ...prodParasPolkadot].find((e) => e.info === chain)?.providers || {}).filter((e) =>
            e.startsWith("wss://")
          );
        }
        if (nodes.length > 1) {
          return race(nodes.map((node) => this.connect([node], chain)));
        }
        return this.connect(nodes, chain);
      })
    );
  }

  public connect(nodes: string[], chainName: RegisteredChainName): Observable<RegisteredChainName | null> {
    if (!!this.apis[chainName]) {
      this.apis[chainName].disconnect();
      delete this.apis[chainName];
    }

    const wsProvider = new WsProvider(nodes);

    const isAcala = chainName === "acala" || chainName === "karura";
    return ApiRx.create(
      isAcala
        ? options({
            provider: wsProvider,
          })
        : {
            provider: wsProvider,
          }
    ).pipe(
      map((api) => {
        // connect success
        if (!!api) {
          if (!this.apis[chainName]) {
            this.apis[chainName] = api;
          } else {
            api.disconnect();
          }
          return chainName;
        }
        return null;
      })
    );
  }

  public disconnect(chainName: RegisteredChainName) {
    if (!!this.apis[chainName]) {
      this.apis[chainName].disconnect();
      delete this.apis[chainName];
    }
  }
}
