import { AnyApi, FixedPointNumber as FN, Token } from "@acala-network/sdk-core";
import { CurrencyNotFound } from "../errors";
import { DeriveBalancesAll } from "@polkadot/api-derive/balances/types";
import { combineLatest, map, Observable, of } from "rxjs";
import { BaseCrossChainAdapter } from "../base-chain-adapter";
import { chains, RegisteredChainName } from "../configs";
import { xcmFeeConfig } from "../configs/xcm-fee";
import { Chain, CrossChainRouter, CrossChainTransferParams, BalanceData, BalanceAdapter, BridgeTxParams, TokenBalance } from "../types";
import { Storage } from "@acala-network/sdk/utils/storage";

interface AstarToken {
  id: string;
  decimals: number;
}

const supported_tokens: Record<string, AstarToken> = {
  KUSD: { id: "18446744073709551616", decimals: 12 },
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
    assets: (tokenId: string, address: string) =>
      Storage.create<any>({
        api: api,
        path: "query.assets.account",
        params: [tokenId, address],
      }),
  };
};

interface AstarBalanceAdapterConfigs {
  chain: RegisteredChainName;
  api: AnyApi;
}

class AstarBalanceAdapter implements BalanceAdapter {
  private storages: ReturnType<typeof createBalanceStorages>;
  readonly chain: RegisteredChainName;
  readonly decimals: number;
  readonly ed: FN;
  readonly nativeToken: string;

  constructor({ chain, api }: AstarBalanceAdapterConfigs) {
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

    return this.storages.assets(tokenObj.id, address).observable.pipe(
      map((balance) => {
        const amount = FN.fromInner(balance.balance?.toString() || "0", tokenObj.decimals);
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

    return of(FN.fromInner(xcmFeeConfig[this.chain][token as string].existentialDeposit, tokenObj.decimals));
  }
}

class BaseAstarAdapter extends BaseCrossChainAdapter {
  private balanceAdapter?: AstarBalanceAdapter;
  constructor(chain: Chain, routers: Omit<CrossChainRouter, "from">[]) {
    super(chain, routers);
  }

  public override async setApi(api: AnyApi) {
    this.api = api;

    await api.isReady;

    this.balanceAdapter = new AstarBalanceAdapter({ chain: this.chain.id, api });
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

    const dst = { parents: 1, interior: { X1: { Parachain: toChain.paraChainId } } };
    const acc = { parents: 0, interior: { X1: { AccountId32: { id: accountId, network: "Any" } } } };
    let ass: any = [{ id: { Concrete: { parents: 0, interior: "Here" } }, fun: { Fungible: amount.toChainData() } }];

    if (token === this.balanceAdapter?.nativeToken) {
      return {
        module: "polkadotXcm",
        call: "reserveTransferAssets",
        params: [{ V1: dst }, { V1: acc }, { V1: ass }, 0],
      };
    }

    const tokenIds: Record<string, string> = {
      KUSD: "0x0081",
    };

    const tokenId = tokenIds[token];
    if (!tokenId) throw new CurrencyNotFound(token);

    ass = [
      {
        id: {
          Concrete: {
            parents: 1,
            interior: { X2: [{ Parachain: toChain.paraChainId }, { GeneralKey: tokenId }] },
          },
        },
        fun: { Fungible: amount.toChainData() },
      },
    ];
    return {
      module: "polkadotXcm",
      call: "reserveTransferAssets",
      params: [{ V1: dst }, { V1: acc }, { V1: ass }, 0],
    };
  }
}

export class ShidenAdapter extends BaseAstarAdapter {
  constructor() {
    super(chains.shiden, [
      { to: chains.karura, token: "SDN" },
      { to: chains.karura, token: "KUSD" },
    ]);
  }
}
