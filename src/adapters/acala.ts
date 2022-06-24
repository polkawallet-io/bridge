import { AnyApi, FixedPointNumber } from "@acala-network/sdk-core";
import { Wallet } from "@acala-network/sdk/wallet";
import { combineLatest, map, Observable } from "rxjs";
import { chains, RegisteredChainName } from "../configs";
import { xcmFeeConfig } from "../configs/xcm-fee";
import { BalanceData, BridgeTxParams, CrossChainRouter, CrossChainTransferParams, Chain, TokenBalance } from "../types";
import { BaseCrossChainAdapter } from "../base-chain-adapter";
import { isChainEqual } from "../utils/is-chain-equal";

interface AcalaAdapterConfigs {
  api: AnyApi;
  wallet: Wallet;
}

export class BaseAcalaAdapter extends BaseCrossChainAdapter {
  private wallet: Wallet;

  constructor(configs: AcalaAdapterConfigs, chain: Chain, routers: Omit<CrossChainRouter, "from">[]) {
    super(configs.api, chain, routers);
    const { wallet } = configs;

    this.wallet = wallet;
  }

  public subscribeMinInput(token: string, to: RegisteredChainName): Observable<FixedPointNumber> {
    return this.wallet.subscribeToken(token).pipe(
      map((r) => {
        return r.ed.add(this.getCrossChainFee(token, to)?.balance || FixedPointNumber.ZERO);
      })
    );
  }

  public subscribeTokenBalance(token: string, address: string): Observable<BalanceData> {
    return this.wallet.subscribeBalance(token, address);
  }

  public subscribeMaxInput(token: string, address: string, to: RegisteredChainName): Observable<FixedPointNumber> {
    const { nativeToken } = this.wallet.getPresetTokens();
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
      balance: FixedPointNumber.fromInner((xcmFeeConfig[destChain][token]?.fee as string) ?? "0", this.wallet.__getToken(token).decimals),
    };
  }

  public getBridgeTxParams(params: CrossChainTransferParams): BridgeTxParams {
    const { to, token, address, amount } = params;
    const tokenFormSDK = this.wallet.__getToken(token);
    const accountId = this.api.createType("AccountId32", address).toHex();
    const toChain = chains[to];

    if (isChainEqual(toChain, "statemine")) {
      const dst = { X2: ["Parent", { ParaChain: toChain.paraChainId }] };
      const acc = { X1: { AccountId32: { id: accountId, network: "Any" } } };
      const ass = [
        {
          ConcreteFungible: {
            id: {
              X2: [{ PalletInstance: tokenFormSDK.locations?.palletInstance }, { GeneralIndex: tokenFormSDK.locations?.generalIndex }],
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
        params: [tokenFormSDK.toChainData() as any, amount.toChainData(), { V1: dst }, dest_weight],
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
      params: [tokenFormSDK.toChainData() as any, amount.toChainData(), { V1: dst }, dest_weight],
    };
  }
}

export class AcalaAdapter extends BaseAcalaAdapter {
  constructor(configs: AcalaAdapterConfigs) {
    super(configs, chains.acala, [
      // polkadot
      { to: chains.polkadot, token: "DOT" },
    ]);
  }
}

export class KaruraAdapter extends BaseAcalaAdapter {
  constructor(configs: AcalaAdapterConfigs) {
    super(configs, chains.karura, [
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
