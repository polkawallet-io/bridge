import { AnyApi, FixedPointNumber as FN, Token } from "@acala-network/sdk-core";
import { CurrencyNotFound } from "../errors";
import { DeriveBalancesAll } from "@polkadot/api-derive/balances/types";
import { combineLatest, map, Observable, of } from "rxjs";
import { BaseCrossChainAdapter } from "../base-chain-adapter";
import { chains, RegisteredChainName } from "../configs";
import { xcmFeeConfig } from "../configs/xcm-fee";
import { Chain, CrossChainRouter, CrossChainTransferParams, BalanceData, BalanceAdapter, BridgeTxParams, TokenBalance } from "../types";
import { Storage } from "@acala-network/sdk/utils/storage";

interface CentrifugeToken {
  symbol: string;
  decimals: number;
}

const supported_tokens: Record<string, CentrifugeToken> = {
  KUSD: { symbol: "KUSD", decimals: 12 },
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
    assets: (address: string, token: string) =>
      Storage.create<any>({
        api: api,
        path: "query.ormlTokens.accounts",
        params: [address, token],
      }),
  };
};

interface CentrifugeBalanceAdapterConfigs {
  chain: RegisteredChainName;
  api: AnyApi;
}

class CentrifugeBalanceAdapter implements BalanceAdapter {
  private storages: ReturnType<typeof createBalanceStorages>;
  readonly chain: RegisteredChainName;
  readonly decimals: number;
  readonly ed: FN;
  readonly nativeToken: string;

  constructor({ chain, api }: CentrifugeBalanceAdapterConfigs) {
    this.storages = createBalanceStorages(api);
    this.chain = chain;
    this.decimals = api.registry.chainDecimals[0];
    this.ed = FN.fromInner(api.consts.balances.existentialDeposit.toString(), this.decimals);
    this.nativeToken = api.registry.chainTokens[0];
  }

  public subscribeBalance(token: string, address: string): Observable<BalanceData> {
    const storage = this.storages.balances(address);

    if (token === this.nativeToken) {
      return storage.observable.pipe(
        map((data) => ({
          free: FN.fromInner(data.freeBalance.toString(), this.decimals),
          locked: FN.fromInner(data.lockedBalance.toString(), this.decimals),
          reserved: FN.fromInner(data.reservedBalance.toString(), this.decimals),
          available: FN.fromInner(data.availableBalance.toString(), this.decimals),
        }))
      );
    }

    const tokenObj = supported_tokens[token];
    if (!tokenObj) throw new CurrencyNotFound(token);

    return this.storages.assets(address, tokenObj.symbol).observable.pipe(
      map((balance) => {
        const amount = FN.fromInner(balance.free?.toString() || "0", tokenObj.decimals);
        return {
          free: amount,
          locked: new FN(0),
          reserved: new FN(0),
          available: amount,
        };
      })
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getED(token?: string | Token): Observable<FN> {
    if (token === this.nativeToken) return of(this.ed);

    const tokenObj = supported_tokens[token as string];
    if (!tokenObj) throw new CurrencyNotFound(token as string);

    return of(FN.fromInner(xcmFeeConfig[this.chain][tokenObj.symbol].existentialDeposit, tokenObj.decimals));
  }
}

class BaseCentrifugeAdapter extends BaseCrossChainAdapter {
  private balanceAdapter?: CentrifugeBalanceAdapter;
  constructor(chain: Chain, routers: Omit<CrossChainRouter, "from">[]) {
    super(chain, routers);
  }

  public override async setApi(api: AnyApi) {
    this.api = api;

    await api.isReady;

    this.balanceAdapter = new CentrifugeBalanceAdapter({ chain: this.chain.id, api });
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
      txFee: this.estimateTxFee(
        {
          amount: FN.ZERO,
          to,
          token,
          address,
        },
        address
      ),
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

  public subscribeMinInput(token: string, to: RegisteredChainName): Observable<FN> {
    if (!this.balanceAdapter) return new Observable((sub) => sub.next(FN.ZERO));

    return of(this.getDestED(token, to).balance.add(this.getCrossChainFee(token, to).balance || FN.ZERO));
  }

  public getDestED(token: string, destChain: RegisteredChainName): TokenBalance {
    return {
      token,
      balance: FN.fromInner((xcmFeeConfig[destChain][token]?.existentialDeposit as string) ?? "0", this.balanceAdapter?.decimals),
    };
  }

  public getCrossChainFee(token: string, destChain: RegisteredChainName): TokenBalance {
    return {
      token,
      balance: FN.fromInner((xcmFeeConfig[destChain][token]?.fee as string) ?? "0", this.balanceAdapter?.decimals),
    };
  }

  public getBridgeTxParams(params: CrossChainTransferParams): BridgeTxParams {
    const { to, token, address, amount } = params;
    const toChain = chains[to];

    const accountId = this.api?.createType("AccountId32", address).toHex();

    const tokenObj = supported_tokens[token];
    if (!tokenObj && token !== this.balanceAdapter?.nativeToken) throw new CurrencyNotFound(token);

    return {
      module: "xTokens",
      call: "transfer",
      params: [
        token === this.balanceAdapter?.nativeToken ? "Native" : tokenObj.symbol,
        amount.toChainData(),
        {
          V1: {
            parents: 1,
            interior: { X2: [{ Parachain: toChain.paraChainId }, { AccountId32: { id: accountId, network: "Any" } }] },
          },
        },
        5_000_000_000,
      ],
    };
  }
}

export class AltairAdapter extends BaseCentrifugeAdapter {
  constructor() {
    super(chains.altair, [
      { to: chains.karura, token: "AIR" },
      { to: chains.karura, token: "KUSD" },
    ]);
  }
}
