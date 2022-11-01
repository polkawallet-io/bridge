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
import { ChainName } from "./configs";

export class ApiProvider {
  protected network: "mainnet" | "testnet";

  constructor(network: "mainnet" | "testnet") {
    this.network = network;
  }

  protected apis: Record<string, ApiRx> = {};
  protected promiseApis: Record<string, ApiPromise> = {};

  public getApi(chainName: string) {
    return this.apis[chainName];
  }

  public getApiPromise(chainName: string) {
    return this.promiseApis[chainName];
  }

  public connectFromChain(
    chainName: ChainName[],
    nodeList: Partial<Record<ChainName, string[]>> | undefined
  ) {
    return combineLatest(
      chainName.map((chain) => {
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
    chainName: ChainName
  ): Observable<ChainName | null> {
    if (this.apis[chainName]) {
      this.apis[chainName].disconnect();
      delete this.apis[chainName];
    }

    if (this.promiseApis[chainName]) {
      this.promiseApis[chainName].disconnect();
      delete this.promiseApis[chainName];
    }

    const wsProvider = new WsProvider(nodes);

    const isAcala = chainName === "acala" || chainName === "karura";
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
          if (!this.apis[chainName]) {
            this.apis[chainName] = api;
          } else {
            api.disconnect();
          }

          promiseApi.then((res) => {
            if (!this.promiseApis[chainName]) {
              this.promiseApis[chainName] = res;
            } else {
              res.disconnect();
            }
          });

          return chainName;
        }

        return null;
      })
    );
  }

  public disconnect(chainName: ChainName) {
    if (this.apis[chainName]) {
      this.apis[chainName].disconnect();
      delete this.apis[chainName];
    }
  }
}
