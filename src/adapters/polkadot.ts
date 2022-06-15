import { AnyApi, FixedPointNumber as FN, Token } from "@acala-network/sdk-core";
import { CurrencyNotFound } from "../errors";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { DeriveBalancesAll } from "@polkadot/api-derive/balances/types";
import { combineLatest, map, Observable, of } from "rxjs";
import { BaseCrossChainAdapter } from "../base-chain-adapter";
import { chains, RegisteredChain } from "../configs";
import { Chain, CrossChainRouter, CrossChainTransferParams, BalanceData, BalanceAdapter, TokenBalance } from "../types";
import { Storage } from "../utils/storage";

interface PolkadotAdapterConfigs {
  api: AnyApi;
}

const crossChainFeeConfigs: Record<string, string> = {
  KSM: "106666660",
  DOT: "106666660",
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const createBalanceStorages = (api: AnyApi) => {
  return {
    balances: (address: string) =>
      Storage.create<DeriveBalancesAll>({
        api: api,
        path: "derive.balances.all",
        params: [address],
      }),
  };
};

interface PolkadotBalanceAdapterConfigs {
  api: AnyApi;
}

class PolkadotBalanceAdapter implements BalanceAdapter {
  private storages: ReturnType<typeof createBalanceStorages>;
  readonly decimals: number;
  readonly ed: FN;
  readonly nativeToken: string;

  constructor({ api }: PolkadotBalanceAdapterConfigs) {
    this.storages = createBalanceStorages(api);
    this.decimals = api.registry.chainDecimals[0];
    this.ed = FN.fromInner(api.consts.balances.existentialDeposit.toString(), this.decimals);
    this.nativeToken = api.registry.chainTokens[0];
  }

  public subscribeBalance(token: string, address: string): Observable<BalanceData> {
    const storage = this.storages.balances(address);

    if (token !== this.nativeToken) throw new CurrencyNotFound(token);

    return storage.observable.pipe(
      map((data) => ({
        free: FN.fromInner(data.freeBalance.toString(), this.decimals),
        locked: FN.fromInner(data.lockedBalance.toString(), this.decimals),
        reserved: FN.fromInner(data.reservedBalance.toString(), this.decimals),
        available: FN.fromInner(data.availableBalance.toString(), this.decimals),
      }))
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getED(_token?: string | Token): FN {
    return this.ed;
  }
}

class BasePolkadotAdapter extends BaseCrossChainAdapter {
  private balanceAdapter: PolkadotBalanceAdapter;
  constructor(configs: PolkadotAdapterConfigs, chain: Chain, routers: Omit<CrossChainRouter, "from">[]) {
    super(configs.api, chain, routers);
    this.balanceAdapter = new PolkadotBalanceAdapter({ api: configs.api });
  }

  public subscribeAvailableBalance(token: string, address: string): Observable<FN> {
    return this.balanceAdapter.subscribeBalance(token, address).pipe(map((i) => i.available));
  }

  public subscribeMaxInput(token: string, address: string, to: RegisteredChain): Observable<FN> {
    return combineLatest({
      txFee: this.measureTransferFee({
        amount: FN.ZERO,
        to,
        token,
        address,
      }),
      balance: this.balanceAdapter.subscribeBalance(token, address).pipe(map((i) => i.available)),
    }).pipe(
      map(({ txFee, balance }) => {
        const feeFactor = 1.2;
        const fee = FN.fromInner(txFee, this.balanceAdapter.decimals).mul(new FN(feeFactor));
        const ed = this.balanceAdapter.getED();

        // always minus ed
        return balance.minus(fee).minus(ed);
      })
    );
  }

  public subscribeMinInput(token: string): Observable<FN> {
    return of(this.balanceAdapter.getED(token).add(this.getCrossChainFee(token)?.balance || FN.ZERO));
  }

  public getCrossChainFee(token: string): TokenBalance {
    return {
      token: "KSM",
      balance: FN.fromInner(crossChainFeeConfigs[token] ?? "0", this.balanceAdapter.decimals),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getCrossChainTokenDecimals(_token: string): number {
    // ignore the token params for only KSM/DOT
    return this.balanceAdapter.decimals;
  }

  public createTx(
    params: CrossChainTransferParams
  ): SubmittableExtrinsic<"promise", ISubmittableResult> | SubmittableExtrinsic<"rxjs", ISubmittableResult> {
    const { to, token, address, amount } = params;
    const toChain = chains[to];

    if (token !== this.balanceAdapter.nativeToken) throw new CurrencyNotFound(token);

    const accountId = this.api.createType("AccountId32", address).toHex();
    const tx = this.api.tx.xcmPallet.reserveTransferAssets;
    const dst = { X1: { ParaChain: toChain.paraChainId }, parents: 0 };
    const acc = { X1: { AccountId32: { id: accountId, network: "Any" } } };
    const ass = [{ ConcreteFungible: { amount: amount.toChainData() } }];
    const callParams = [{ V0: dst }, { V0: acc }, { V0: ass }, 0];

    return tx(...callParams);
  }
}

export class PolkadotAdapter extends BasePolkadotAdapter {
  constructor(configs: PolkadotAdapterConfigs) {
    super(configs, chains.polkadot, [{ to: chains.acala, token: "DOT" }]);
  }
}

export class KusamaAdapter extends BasePolkadotAdapter {
  constructor(configs: PolkadotAdapterConfigs) {
    super(configs, chains.kusama, [{ to: chains.karura, token: "KSM" }]);
  }
}
