import { BaseSDK } from '@acala-network/sdk';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

import { ChainName } from './configs/index';
import { BaseCrossChainAdapter } from './base-chain-adapter';
import { BridgeRouterManager } from './cross-chain-router';
import { NoCrossChainAdapterFound } from './errors';
import { BridgeConfigs, Chain } from './types';

export class Bridge implements BaseSDK {
  readonly router: BridgeRouterManager;
  readonly adapters: BaseCrossChainAdapter[];

  public consts!: {
    runtimeChain: string;
  };

  public isReady$: BehaviorSubject<boolean>;

  constructor ({ adapters }: BridgeConfigs) {
    this.isReady$ = new BehaviorSubject<boolean>(false);
    this.adapters = adapters;
    this.router = new BridgeRouterManager({ adapters });
    this.init();
  }

  public init (): void {
    this.adapters.forEach((i) => this.router.addRouters(i.getRouters()));
    this.adapters.forEach((i) => i.injectFindAdapter(this.findAdapter));

    this.router.updateDisabledRouters().then(() => this.isReady$.next(true));
  }

  public get isReady (): Promise<boolean> {
    return firstValueFrom(this.isReady$.asObservable().pipe((i) => i));
  }

  public findAdapter = (chain: ChainName | Chain): BaseCrossChainAdapter => {
    const result = this.router.findAdapterByName(chain);

    if (!result) {
      throw new NoCrossChainAdapterFound(JSON.stringify(chain));
    }

    return result;
  };
}

export * from './cross-chain-router';
export * from './api-provider';
export * from './adapters';
export * from './configs/index';
export * from './configs/xcm-fee';
export * from './types';
