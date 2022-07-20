import { AnyApi, FixedPointNumber as FN, Token } from "@acala-network/sdk-core";
import { CurrencyNotFound } from "../errors";
import { DeriveBalancesAll } from "@polkadot/api-derive/balances/types";
import { combineLatest, map, Observable, of } from "rxjs";
import { BaseCrossChainAdapter } from "../base-chain-adapter";
import { chains, RegisteredChainName } from "../configs";
import { Chain, CrossChainRouter, CrossChainTransferParams, BalanceData, BalanceAdapter, BridgeTxParams } from "../types";
import { Storage } from "@acala-network/sdk/utils/storage";

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

interface DarwiniaBalanceAdapterConfigs {
  chain: RegisteredChainName;
  api: AnyApi;
}

class DarwiniaBalanceAdapter implements BalanceAdapter {
  private storages: ReturnType<typeof createBalanceStorages>;
  readonly chain: RegisteredChainName;
  readonly decimals: number;
  readonly ed: FN;
  readonly nativeToken: string;

  constructor({ chain, api }: DarwiniaBalanceAdapterConfigs) {
    this.storages = createBalanceStorages(api);
    this.chain = chain;
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
  public getED(token?: string | Token): Observable<FN> {
    return of(this.ed);
  }
}

class BaseDarwiniaAdapter extends BaseCrossChainAdapter {
  private balanceAdapter?: DarwiniaBalanceAdapter;
  constructor(chain: Chain, routers: Omit<CrossChainRouter, "from">[]) {
    super(chain, routers);
  }

  public override async setApi(api: AnyApi) {
    this.api = api;

    await api.isReady;

    this.balanceAdapter = new DarwiniaBalanceAdapter({ chain: this.chain.id, api });
  }

  public subscribeTokenBalance(token: string, address: string): Observable<BalanceData> {
    if (!this.balanceAdapter) {
      return new Observable((sub) =>
        sub.next({
          free: FN.ZERO,
          locked: FN.ZERO,
          available: FN.ZERO,
          reserved: FN.ZERO,
        })
      );
    }

    return this.balanceAdapter.subscribeBalance(token, address);
  }

  public subscribeMaxInput(token: string, address: string, to: RegisteredChainName): Observable<FN> {
    if (!this.balanceAdapter) return new Observable((sub) => sub.next(FN.ZERO));

    return combineLatest({
      txFee:
        token === this.balanceAdapter?.nativeToken
          ? this.estimateTxFee(
              {
                amount: FN.ZERO,
                to,
                token,
                address,
              },
              address
            )
          : "0",
      balance: this.balanceAdapter.subscribeBalance(token, address).pipe(map((i) => i.available)),
      ed: this.balanceAdapter?.getED(token),
    }).pipe(
      map(({ txFee, balance, ed }) => {
        const feeFactor = 1.2;
        const fee = FN.fromInner(txFee, this.balanceAdapter!.decimals).mul(new FN(feeFactor));

        // always minus ed
        return balance.minus(fee).minus(ed || FN.ZERO);
      })
    );
  }

  public getBridgeTxParams(params: CrossChainTransferParams): BridgeTxParams {
    const { to, token, address, amount } = params;
    const toChain = chains[to];

    if (token !== this.balanceAdapter?.nativeToken) throw new CurrencyNotFound(token);

    const accountId = this.api?.createType("AccountId32", address).toHex();

    const dst = { X2: ["Parent", { ParaChain: toChain.paraChainId }] };
    const acc = { X1: { AccountId32: { id: accountId, network: "Any" } } };
    const ass = [{ ConcreteFungible: { amount: amount.toChainData() } }];

    return {
      module: "polkadotXcm",
      call: "limitedReserveTransferAssets",
      params: [{ V0: dst }, { V0: acc }, { V0: ass }, 0, "Unlimited"],
    };
  }
}

export class CrabAdapter extends BaseDarwiniaAdapter {
  constructor() {
    super(chains.crab, [{ to: chains.karura, token: "CRAB" }]);
  }
}
