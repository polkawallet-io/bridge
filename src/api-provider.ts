import { ApiPromise, WsProvider } from "@polkadot/api";
import {
  prodParasKusama,
  prodRelayKusama,
  prodRelayPolkadot,
  prodParasPolkadot,
  prodParasKusamaCommon,
} from "@polkadot/apps-config/endpoints";
import { RegisteredChainName } from "./configs";

export class ApiProvider {
  protected apis: Record<string, ApiPromise> = {};

  public getApi(chainName: string) {
    return this.apis[chainName];
  }

  public connectFromChain(chainName: RegisteredChainName[]) {
    return Promise.all(
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
        return Promise.race(nodes.map((node) => this.connect([node], chain)));
      })
    );
  }

  public async connect(nodes: string[], chainName: RegisteredChainName) {
    if (!!this.apis[chainName]) {
      this.apis[chainName].disconnect();
      delete this.apis[chainName];
    }

    const wsProvider = new WsProvider(nodes);
    try {
      const res = await ApiPromise.create({
        provider: wsProvider,
      });
      await res.isReady;

      if (!this.apis[chainName]) {
        this.apis[chainName] = res;
        return chainName;
      }
      res.disconnect();
      return null;
    } catch (err) {
      (<any>window).send("log", `connect failed`);
      wsProvider.disconnect();
      return null;
    }
  }

  public disconnect(chainName: RegisteredChainName) {
    if (!!this.apis[chainName]) {
      this.apis[chainName].disconnect();
      delete this.apis[chainName];
    }
  }
}
