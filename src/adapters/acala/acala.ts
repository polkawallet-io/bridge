import { Wallet } from "@acala-network/sdk/wallet";
import { AnyApi, FixedPointNumber } from "@acala-network/sdk-core";
import {
  catchError,
  combineLatest,
  firstValueFrom,
  map,
  Observable,
  of,
} from "rxjs";

import { ApiRx } from "@polkadot/api";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";

import { BaseCrossChainAdapter } from "../../base-chain-adapter";
import { ChainId, chains } from "../../configs";
import { ApiNotFound, InvalidAddress, TokenNotFound } from "../../errors";
import { BalanceData, ExtendedToken, TransferParams } from "../../types";
import { isChainEqual } from "../../utils/is-chain-equal";
import { statemineTokensConfig, statemintTokensConfig } from "../statemint";
import {
  createXTokensAssetsParam,
  createXTokensDestParam,
  validateAddress,
} from "../../utils";
import { acalaRouteConfigs, acalaTokensConfig } from "./acala-configs";
import { karuraRouteConfigs, karuraTokensConfig } from "./karura-configs";

class BaseAcalaAdapter extends BaseCrossChainAdapter {
  private wallet?: Wallet;

  public async init(api: AnyApi, wallet?: Wallet) {
    this.api = api;

    if (this.api?.type === "rxjs") {
      await firstValueFrom(api.isReady as Observable<ApiRx>);
    }

    await api.isReady;

    // use custom wallet or create a new one
    if (wallet) {
      this.wallet = wallet;
    } else {
      this.wallet = new Wallet(api);
    }

    await this.wallet.isReady;
  }

  public override subscribeMinInput(
    token: string,
    to: ChainId
  ): Observable<FixedPointNumber> {
    if (!this.wallet) {
      throw new ApiNotFound(this.chain.id);
    }

    const destFee = this.getCrossChainFee(token, to);

    return of(
      this.getDestED(token, to).balance.add(
        destFee.token === token ? destFee.balance : FixedPointNumber.ZERO
      )
    );
  }

  public subscribeTokenBalance(
    token: string,
    address: string
  ): Observable<BalanceData> {
    if (!this.wallet) {
      throw new ApiNotFound(this.chain.id);
    }

    const zeroResult: Observable<BalanceData> = new Observable((sub) =>
      sub.next({
        free: FixedPointNumber.ZERO,
        locked: FixedPointNumber.ZERO,
        available: FixedPointNumber.ZERO,
        reserved: FixedPointNumber.ZERO,
      })
    );

    return this.wallet
      .subscribeBalance(token, address)
      .pipe(catchError((_) => zeroResult));
  }

  public subscribeMaxInput(
    token: string,
    address: string,
    to: ChainId
  ): Observable<FixedPointNumber> {
    if (!this.wallet) {
      throw new ApiNotFound(this.chain.id);
    }

    const tokens = this.wallet.getPresetTokens();
    const { nativeToken } = tokens;

    return combineLatest({
      txFee:
        token === nativeToken.name
          ? this.estimateTxFee({
              amount: FixedPointNumber.ZERO,
              to,
              token,
              address:
                to === "moonriver" || to === "moonbeam"
                  ? "0x0000000000000000000000000000000000000000"
                  : address,
              signer: address,
            })
          : "0",
      balance: this.wallet
        .subscribeBalance(token, address)
        .pipe(map((i) => i.available)),
    }).pipe(
      map(({ balance, txFee }) => {
        const feeFactor = 1.2;
        const fee = FixedPointNumber.fromInner(
          txFee,
          nativeToken.decimals || 12
        ).mul(new FixedPointNumber(feeFactor));

        return balance.minus(fee);
      })
    );
  }

  public createTx(
    params: TransferParams
  ):
    | SubmittableExtrinsic<"promise", ISubmittableResult>
    | SubmittableExtrinsic<"rxjs", ISubmittableResult> {
    if (!this.api) throw new ApiNotFound(this.chain.id);

    const { address, amount, to, token } = params;
    const tokenFormSDK = this.wallet?.getToken(token);
    const toChain = chains[to];

    const useAccountKey20 =
      isChainEqual(toChain, "moonbeam") || isChainEqual(toChain, "moonriver");
    const isToRelayChain =
      isChainEqual(toChain, "kusama") || isChainEqual(toChain, "polkadot");

    const accountId = useAccountKey20
      ? address
      : this.api?.createType("AccountId32", address).toHex();

    if (!validateAddress(address, useAccountKey20 ? "ethereum" : "substract")) {
      throw new InvalidAddress(address);
    }

    if (isChainEqual(toChain, "statemint")) {
      const tokenData = statemintTokensConfig[token];

      if (!token) throw new TokenNotFound(token);

      return this.api.tx.xTokens.transferMultiassetWithFee(
        createXTokensAssetsParam(
          this.api,
          toChain.paraChainId,
          tokenData.toRaw(),
          amount.toChainData()
        ),
        {
          V3: {
            id: {
              Concrete: {
                parents: 1,
                interior: "Here",
              },
            },
            fun: {
              Fungible: "100000000",
            },
          },
        },
        createXTokensDestParam(this.api, toChain.paraChainId, accountId) as any,
        "Unlimited"
      );
    }

    // for statemine
    if (isChainEqual(toChain, "statemine")) {
      const tokenData: ExtendedToken = isChainEqual(toChain, "statemine")
        ? statemineTokensConfig[token]
        : statemintTokensConfig[token];

      if (!token) throw new TokenNotFound(token);

      return this.api.tx.xTokens.transferMultiasset(
        createXTokensAssetsParam(
          this.api,
          toChain.paraChainId,
          tokenData.toRaw(),
          amount.toChainData()
        ),
        createXTokensDestParam(this.api, toChain.paraChainId, accountId) as any,
        "Unlimited"
      );
    }

    return this.api.tx.xTokens.transfer(
      tokenFormSDK?.toChainData(),
      amount.toChainData(),
      createXTokensDestParam(this.api, toChain.paraChainId, accountId, {
        isToRelayChain,
        useAccountKey20,
      }) as any,
      "Unlimited"
    );
  }
}

export class AcalaAdapter extends BaseAcalaAdapter {
  constructor() {
    super(chains.acala, acalaRouteConfigs, acalaTokensConfig);
  }
}

export class KaruraAdapter extends BaseAcalaAdapter {
  constructor() {
    super(chains.karura, karuraRouteConfigs, karuraTokensConfig);
  }
}
