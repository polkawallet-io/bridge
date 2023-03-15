import { options } from "@acala-network/api";
import { combineLatest, map, Observable, race } from "rxjs";

import { ApiPromise, ApiRx, WsProvider } from "@polkadot/api";
import {
  prodParasKusama,
  prodParasKusamaCommon,
  prodParasPolkadot,
  prodRelayKusama,
  prodRelayPolkadot,
} from "@polkadot/apps-config/endpoints";

import { isChainEqual } from "./utils/is-chain-equal";
import { ChainId } from "./configs";

export class ApiProvider {
  protected apis: Record<string, ApiRx> = {};
  protected promiseApis: Record<string, ApiPromise> = {};

  public getApi(ChainId: string) {
    return this.apis[ChainId];
  }

  public getApiPromise(ChainId: string) {
    return this.promiseApis[ChainId];
  }

  public connectFromChain(
    ChainId: ChainId[],
    nodeList: Partial<Record<ChainId, string[]>> | undefined
  ) {
    return combineLatest(
      ChainId.map((chain) => {
        let nodes = (nodeList || {})[chain];

        if (!nodes) {
          if (isChainEqual(chain, "kusama")) {
            nodes = Object.values(prodRelayKusama.providers).filter((e) =>
              e.startsWith("wss://")
            );
          } else if (chain === "polkadot") {
            nodes = Object.values(prodRelayPolkadot.providers).filter((e) =>
              e.startsWith("wss://")
            );
          } else if (chain === "statemine") {
            nodes = Object.values(
              prodParasKusamaCommon.find((e) => e.info === chain)?.providers ||
                {}
            ).filter((e) => e.startsWith("wss://"));
          } else {
            nodes = Object.values(
              [...prodParasKusama, ...prodParasPolkadot].find(
                (e) => e.info === chain
              )?.providers || {}
            ).filter((e) => e.startsWith("wss://"));
          }
        }

        if (nodes.length > 1) {
          return race(nodes.map((node) => this.connect([node], chain)));
        }

        return this.connect(nodes, chain);
      })
    );
  }

  public connect(
    nodes: string[],
    ChainId: ChainId
  ): Observable<ChainId | null> {
    if (this.apis[ChainId]) {
      this.apis[ChainId].disconnect();
      delete this.apis[ChainId];
    }

    if (this.promiseApis[ChainId]) {
      this.promiseApis[ChainId].disconnect();
      delete this.promiseApis[ChainId];
    }

    const wsProvider = new WsProvider(nodes);

    const isAcala = ChainId === "acala" || ChainId === "karura";
    const option = isAcala
      ? options({
          provider: wsProvider,
        })
      : {
          provider: wsProvider,
        };
    const promiseApi = ApiPromise.create(option);

    return ApiRx.create(option).pipe(
      map((api) => {
        // connect success
        if (api) {
          if (!this.apis[ChainId]) {
            this.apis[ChainId] = api;
          } else {
            api.disconnect();
          }

          promiseApi.then((res) => {
            if (!this.promiseApis[ChainId]) {
              this.promiseApis[ChainId] = res;
            } else {
              res.disconnect();
            }
          });

          return ChainId;
        }

        return null;
      })
    );
  }

  public disconnect(ChainId: ChainId) {
    if (this.apis[ChainId]) {
      this.apis[ChainId].disconnect();
      delete this.apis[ChainId];
    }
  }
}
