import { AnyApi, FixedPointNumber } from "@acala-network/sdk-core";
import { Wallet } from "@acala-network/sdk/wallet";
import { combineLatest, firstValueFrom, map, Observable, catchError } from "rxjs";
import { chains, RegisteredChainName } from "../configs";
import { xcmFeeConfig } from "../configs/xcm-fee";
import { BalanceData, BridgeTxParams, CrossChainRouter, CrossChainTransferParams, Chain, TokenBalance } from "../types";
import { BaseCrossChainAdapter } from "../base-chain-adapter";
import { isChainEqual } from "../utils/is-chain-equal";
import { ApiRx } from "@polkadot/api";

export class BaseAcalaAdapter extends BaseCrossChainAdapter {
  private wallet?: Wallet;

  constructor(chain: Chain, routers: Omit<CrossChainRouter, "from">[]) {
    super(chain, routers);
  }

  public override async setApi(api: AnyApi) {
    this.api = api;

    if (this.api?.type === "rxjs") {
      await firstValueFrom(api.isReady as Observable<ApiRx>);
    }
    await api.isReady;

    this.wallet = new Wallet(api);

    await this.wallet.isReady;
  }

  public subscribeMinInput(token: string, to: RegisteredChainName): Observable<FixedPointNumber> {
    if (!this.wallet) return new Observable((sub) => sub.next(FixedPointNumber.ZERO));

    return this.wallet.subscribeToken(token).pipe(
      map((r) => {
        return r.ed.add(this.getCrossChainFee(token, to)?.balance || FixedPointNumber.ZERO);
      })
    );
  }

  public subscribeTokenBalance(token: string, address: string): Observable<BalanceData> {
    const zeroResult: Observable<BalanceData> = new Observable((sub) =>
      sub.next({
        free: FixedPointNumber.ZERO,
        locked: FixedPointNumber.ZERO,
        available: FixedPointNumber.ZERO,
        reserved: FixedPointNumber.ZERO,
      })
    );

    if (!this.wallet) {
      return zeroResult;
    }

    return this.wallet.subscribeBalance(token, address).pipe(catchError((_) => zeroResult));
  }

  public subscribeMaxInput(token: string, address: string, to: RegisteredChainName): Observable<FixedPointNumber> {
    if (!this.wallet) return new Observable((sub) => sub.next(FixedPointNumber.ZERO));

    const tokens = this.wallet.getPresetTokens();
    const { nativeToken } = tokens;
    return combineLatest({
      txFee:
        token === nativeToken.name
          ? this.estimateTxFee({
              amount: FixedPointNumber.ZERO,
              to,
              token,
              address,
            })
          : "0",
      balance: this.wallet.subscribeBalance(token, address).pipe(map((i) => i.available)),
    }).pipe(
      map(({ txFee, balance }) => {
        const feeFactor = 1.2;
        const fee = FixedPointNumber.fromInner(txFee, nativeToken.decimals || 12).mul(new FixedPointNumber(feeFactor));

        return balance.minus(fee);
      })
    );
  }

  public getCrossChainFee(token: string, destChain: RegisteredChainName): TokenBalance {
    return {
      token,
      balance: FixedPointNumber.fromInner((xcmFeeConfig[destChain][token]?.fee as string) ?? "0", this.wallet?.__getToken(token).decimals),
    };
  }

  public getBridgeTxParams(params: CrossChainTransferParams): BridgeTxParams {
    const { to, token, address, amount } = params;
    const tokenFormSDK = this.wallet?.__getToken(token);
    const accountId = this.api?.createType("AccountId32", address).toHex();
    const toChain = chains[to];

    if (isChainEqual(toChain, "statemine")) {
      const dst = { X2: ["Parent", { ParaChain: toChain.paraChainId }] };
      const acc = { X1: { AccountId32: { id: accountId, network: "Any" } } };
      const ass = [
        {
          ConcreteFungible: {
            id: {
              X2: [{ PalletInstance: tokenFormSDK?.locations?.palletInstance }, { GeneralIndex: tokenFormSDK?.locations?.generalIndex }],
            },
            amount: amount.toChainData(),
          },
        },
      ];

      return {
        module: "polkadotXcm",
        call: "limitedReserveTransferAssets",
        params: [{ V0: dst }, { V0: acc }, { V0: ass }, 0, "Unlimited"],
      };
    }

    const dest_weight = 5 * 1_000_000_000;

    if (isChainEqual(toChain, "kusama") || isChainEqual(toChain, "polkadot")) {
      const dst = { interior: { X1: { AccountId32: { id: accountId, network: "Any" } } }, parents: 1 };

      return {
        module: "xTokens",
        call: "transfer",
        params: [tokenFormSDK?.toChainData() as any, amount.toChainData(), { V1: dst }, dest_weight],
      };
    }

    // if destination is not statemine/kusama
    const dst = {
      parents: 1,
      interior: {
        X2: [{ Parachain: toChain.paraChainId }, { AccountId32: { id: accountId, network: "Any" } }],
      },
    };

    return {
      module: "xTokens",
      call: "transfer",
      params: [tokenFormSDK?.toChainData() as any, amount.toChainData(), { V1: dst }, dest_weight],
    };
  }
}

export class AcalaAdapter extends BaseAcalaAdapter {
  constructor() {
    super(chains.acala, [
      // polkadot
      { to: chains.polkadot, token: "DOT" },
    ]);
  }
}

export class KaruraAdapter extends BaseAcalaAdapter {
  constructor() {
    super(chains.karura, [
      // kusama
      { to: chains.kusama, token: "KSM" },
      // bifrost
      { to: chains.bifrost, token: "KAR" },
      { to: chains.bifrost, token: "KUSD" },
      { to: chains.bifrost, token: "BNC" },
      { to: chains.bifrost, token: "VSKSM" },
      // statemine
      { to: chains.statemine, token: "RMRK" },
      { to: chains.statemine, token: "ARIS" },
      // quartz
      { to: chains.quartz, token: "QTZ" },
      // kintsugi
      { to: chains.kintsugi, token: "KINT" },
      // khala
      { to: chains.khala, token: "KAR" },
      { to: chains.khala, token: "KUSD" },
      { to: chains.khala, token: "PHA" },
    ]);
  }
}
