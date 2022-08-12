import { BaseSDK } from "@acala-network/sdk";
import { BehaviorSubject, filter, firstValueFrom } from "rxjs";

import { ChainName } from "./configs/index";
import { BaseCrossChainAdapter } from "./base-chain-adapter";
import { BridgeRouterManager } from "./cross-chain-router";
import { NoCrossChainAdapterFound } from "./errors";
import { BridgeConfigs, Chain, RouterFilter } from "./types";

export class Bridge implements BaseSDK {
  readonly router: BridgeRouterManager;
  readonly adapters: BaseCrossChainAdapter[];

  public consts!: {
    runtimeChain: string;
  };

  public isReady$: BehaviorSubject<boolean>;

  constructor({ adapters, routersDisabled }: BridgeConfigs) {
    this.isReady$ = new BehaviorSubject<boolean>(false);
    this.adapters = adapters;
    this.router = new BridgeRouterManager({ adapters, routersDisabled });
    this.init(routersDisabled);
  }

  public init(routersDisabled?: RouterFilter[]): void {
    this.adapters.forEach((i) => this.router.addRouters(i.getRouters()));
    this.adapters.forEach((i) => i.injectFindAdapter(this.findAdapter));

    if (routersDisabled === undefined) {
      this.router.updateDisabledRouters().then(() => this.isReady$.next(true));
    } else {
      this.isReady$.next(true);
    }
  }

  public get isReady(): Promise<boolean> {
    return firstValueFrom(
      this.isReady$.asObservable().pipe(filter((i) => i === true))
    );
  }

  public findAdapter = (chain: ChainName | Chain): BaseCrossChainAdapter => {
    const result = this.router.findAdapterByName(chain);

    if (!result) {
      throw new NoCrossChainAdapterFound(JSON.stringify(chain));
    }

    return result;
  };
}

export * from "./cross-chain-router";
export * from "./api-provider";
export * from "./adapters";
export * from "./configs/index";
export * from "./types";
