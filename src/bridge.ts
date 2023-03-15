import { BaseSDK } from "@acala-network/sdk";
import { BehaviorSubject, filter, firstValueFrom } from "rxjs";

import { ChainId } from "./configs/index";
import { BaseCrossChainAdapter } from "./base-chain-adapter";
import { BridgeRouterManager } from "./cross-chain-router";
import { NoCrossChainAdapterFound } from "./errors";
import { BridgeConfigs, Chain } from "./types";
import { DEV_ROUTER_DISABLED } from "./configs/common";

export class Bridge implements BaseSDK {
  readonly router: BridgeRouterManager;
  readonly adapters: BaseCrossChainAdapter[];

  public consts!: {
    runtimeChain: string;
  };

  public isReady$: BehaviorSubject<boolean>;

  constructor({
    adapters,
    disabledRouters = DEV_ROUTER_DISABLED,
  }: BridgeConfigs) {
    this.isReady$ = new BehaviorSubject<boolean>(false);
    this.adapters = adapters;
    this.router = new BridgeRouterManager({ adapters, disabledRouters });
    this.init();
  }

  public init(): void {
    this.adapters.forEach((i) => this.router.addRouters(i.getRouters()));
    this.adapters.forEach((i) => i.injectFindAdapter(this.findAdapter));

    this.router.init().then(() => this.isReady$.next(true));
  }

  public get isReady(): Promise<boolean> {
    return firstValueFrom(
      this.isReady$.asObservable().pipe(filter((i) => i === true))
    );
  }

  public findAdapter = (chain: ChainId | Chain): BaseCrossChainAdapter => {
    const result = this.router.findAdapterByName(chain);

    if (!result) {
      throw new NoCrossChainAdapterFound(JSON.stringify(chain));
    }

    return result;
  };
}
