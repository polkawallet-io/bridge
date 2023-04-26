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

import "@acala-network/types/argument/api-tx";
import { ApiRx } from "@polkadot/api";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";

import { BaseCrossChainAdapter } from "../base-chain-adapter";
import { ChainName, chains } from "../configs";
import { ApiNotFound, DestinationWeightNotFound } from "../errors";
import {
  BalanceData,
  BasicToken,
  CrossChainRouterConfigs,
  CrossChainTransferParams,
} from "../types";
import { supportsUnlimitedDestWeight } from "../utils/xtokens-dest-weight";
import { supportsV0V1Multilocation } from "../utils/xcm-versioned-multilocation-check";

const ACALA_DEST_WEIGHT = "5000000000";

export const acalaRoutersConfig: Omit<CrossChainRouterConfigs, "from">[] = [
  {
    to: "interlay",
    token: "INTR",
    xcm: {
      // during chopsticks test: fee = 21_660_472. Add 10x margin
      fee: { token: "INTR", amount: "216604720" },
      weightLimit: ACALA_DEST_WEIGHT,
    },
  },
  {
    to: "interlay",
    token: "IBTC",
    xcm: {
      // during chopsticks test: fee = 71. Add 10x margin
      fee: { token: "IBTC", amount: "710" },
      weightLimit: ACALA_DEST_WEIGHT,
    },
  },
];

export const karuraRoutersConfig: Omit<CrossChainRouterConfigs, "from">[] = [
  {
    to: "kintsugi",
    token: "KINT",
    xcm: {
      // local tests in chopsticks indicate fees are around 250k (atomic units)
      // use value rounded up * 10 to account for KINT price fluctations
      fee: { token: "KINT", amount: "3000000000" },
      weightLimit: ACALA_DEST_WEIGHT,
    },
  },
  {
    to: "kintsugi",
    token: "KBTC",
    xcm: {
      // local tests in chopsticks indicate fees are 107 satoshi
      fee: { token: "KBTC", amount: "1070" },
      weightLimit: ACALA_DEST_WEIGHT,
    },
  },
  {
    to: "kintsugi",
    token: "LKSM",
    xcm: {
      // fees in chopsticks tests: 186_480_000
      fee: { token: "LKSM", amount: "2000000000" },
      weightLimit: ACALA_DEST_WEIGHT,
    },
  },
];

export const acalaTokensConfig: Record<string, BasicToken> = {
  INTR: { name: "INTR", symbol: "INTR", decimals: 10, ed: "1000000000" },
  IBTC: { name: "IBTC", symbol: "IBTC", decimals: 8, ed: "100" },
};

// Config values taken from querying assetRegistry.assetMetadatas
export const karuraTokensConfig: Record<string, BasicToken> = {
  LKSM: { name: "LKSM", symbol: "LKSM", decimals: 12, ed: "500000000" },
  KINT: { name: "KINT", symbol: "KINT", decimals: 12, ed: "133330000" },
  KBTC: { name: "KBTC", symbol: "KBTC", decimals: 8, ed: "66" },
};

class BaseAcalaAdapter extends BaseCrossChainAdapter {
  private wallet?: Wallet;

  public override async setApi(api: AnyApi) {
    this.api = api;

    if (this.api?.type === "rxjs") {
      await firstValueFrom(api.isReady as Observable<ApiRx>);
    }

    await api.isReady;

    this.wallet = new Wallet(api);

    await this.wallet.isReady;
  }

  public override subscribeMinInput(
    token: string,
    to: ChainName
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
    to: ChainName
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
              address,
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
    params: CrossChainTransferParams
  ):
    | SubmittableExtrinsic<"promise", ISubmittableResult>
    | SubmittableExtrinsic<"rxjs", ISubmittableResult> {
    if (this.api === undefined) {
      throw new ApiNotFound(this.chain.id);
    }

    const { address, amount, to, token } = params;

    const tokenFormSDK = this.wallet?.getToken(token);
    const toChain = chains[to];

    // use "Unlimited" if the xToken.transfer's fourth parameter version supports it
    const destWeight = supportsUnlimitedDestWeight(this.api)
      ? "Unlimited"
      : this.getDestWeight(token, to);

    if (destWeight === undefined) {
      throw new DestinationWeightNotFound(this.chain.id, to, token);
    }

    const accountId = this.api?.createType("AccountId32", address).toHex();
    const supportsV1 = supportsV0V1Multilocation(this.api);

    const accountIdPart = supportsV1
      ? { AccountId32: { id: accountId, network: "Any" } }
      : { AccountId32: { id: accountId } };

    const destPart = {
      parents: 1,
      interior: {
        X2: [{ Parachain: toChain.paraChainId }, accountIdPart],
      },
    };

    const dst = supportsV1 ? { V1: destPart } : { V3: destPart };

    return this.api.tx.xTokens.transfer(
      tokenFormSDK?.toChainData() as any,
      amount.toChainData(),
      dst as any,
      destWeight
    );
  }
}

export class AcalaAdapter extends BaseAcalaAdapter {
  constructor() {
    super(chains.acala, acalaRoutersConfig, acalaTokensConfig);
  }
}

export class KaruraAdapter extends BaseAcalaAdapter {
  constructor() {
    super(chains.karura, karuraRoutersConfig, karuraTokensConfig);
  }
}
