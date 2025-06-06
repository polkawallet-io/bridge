import { Storage } from "@acala-network/sdk/utils/storage";
import { AnyApi, FixedPointNumber as FN } from "@acala-network/sdk-core";
import { combineLatest, map, Observable } from "rxjs";

import { SubmittableExtrinsic } from "@polkadot/api/types";
import { DeriveBalancesAll } from "@polkadot/api-derive/balances/types";
import { ISubmittableResult } from "@polkadot/types/types";

import { BalanceAdapter, BalanceAdapterConfigs } from "../balance-adapter";
import { BaseCrossChainAdapter } from "../base-chain-adapter";
import { ChainId, chains } from "../configs";
import { ApiNotFound, InvalidAddress, TokenNotFound } from "../errors";
import { BalanceData, BasicToken, TransferParams } from "../types";
import {
  createPolkadotXCMAccount,
  createPolkadotXCMAsset,
  createPolkadotXCMDest,
  createRouteConfigs,
  validateAddress,
  getDestAccountInfo,
} from "../utils";

const crabRouteConfigs = createRouteConfigs("crab", [
  {
    to: "karura",
    token: "CRAB",
    xcm: {
      fee: { token: "CRAB", amount: "64000000000000000" },
      weightLimit: "Unlimited",
    },
  },
]);

export const crabTokensConfig: Record<string, BasicToken> = {
  CRAB: { name: "CRAB", symbol: "CRAB", decimals: 18, ed: "0" },
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const createBalanceStorages = (api: AnyApi) => {
  return {
    balances: (address: string) =>
      Storage.create<DeriveBalancesAll>({
        api,
        path: "derive.balances.all",
        params: [address],
      }),
  };
};

class DarwiniaBalanceAdapter extends BalanceAdapter {
  private storages: ReturnType<typeof createBalanceStorages>;

  constructor({ api, chain, tokens }: BalanceAdapterConfigs) {
    super({ api, chain, tokens });
    this.storages = createBalanceStorages(api);
  }

  public subscribeBalance(
    token: string,
    address: string
  ): Observable<BalanceData> {
    if (!validateAddress(address)) throw new InvalidAddress(address);

    const storage = this.storages.balances(address);

    if (token !== this.nativeToken) {
      throw new TokenNotFound(token);
    }

    return storage.observable.pipe(
      map((data) => ({
        free: FN.fromInner(data.freeBalance.toString(), this.decimals),
        locked: FN.fromInner(data.lockedBalance.toString(), this.decimals),
        reserved: FN.fromInner(data.reservedBalance.toString(), this.decimals),
        available: FN.fromInner(
          data.availableBalance.toString(),
          this.decimals
        ),
      }))
    );
  }
}

class BaseDarwiniaAdapter extends BaseCrossChainAdapter {
  private balanceAdapter?: DarwiniaBalanceAdapter;

  public async init(api: AnyApi) {
    this.api = api;

    await api.isReady;

    this.balanceAdapter = new DarwiniaBalanceAdapter({
      chain: this.chain.id as ChainId,
      api,
      tokens: crabTokensConfig,
    });
  }

  public subscribeTokenBalance(
    token: string,
    address: string
  ): Observable<BalanceData> {
    if (!this.balanceAdapter) {
      throw new ApiNotFound(this.chain.id);
    }

    return this.balanceAdapter.subscribeBalance(token, address);
  }

  public subscribeMaxInput(
    token: string,
    address: string,
    to: ChainId
  ): Observable<FN> {
    if (!this.balanceAdapter) {
      throw new ApiNotFound(this.chain.id);
    }

    return combineLatest({
      txFee:
        token === this.balanceAdapter?.nativeToken
          ? this.estimateTxFee({
              amount: FN.ONE,
              to,
              token,
              address,
              signer: address,
            })
          : "0",
      balance: this.balanceAdapter
        .subscribeBalance(token, address)
        .pipe(map((i) => i.available)),
    }).pipe(
      map(({ balance, txFee }) => {
        const tokenMeta = this.balanceAdapter?.getToken(token);
        const feeFactor = 1.2;
        const fee = FN.fromInner(txFee, tokenMeta?.decimals).mul(
          new FN(feeFactor)
        );

        // always minus ed
        return balance
          .minus(fee)
          .minus(FN.fromInner(tokenMeta?.ed || "0", tokenMeta?.decimals));
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

    const { accountId, accountType, addrType } = getDestAccountInfo(
      address,
      token,
      this.api,
      to
    );

    if (!validateAddress(address, addrType)) throw new InvalidAddress(address);

    const toChain = chains[to];

    // only support native token
    if (token !== this.balanceAdapter?.nativeToken) {
      throw new TokenNotFound(token);
    }

    const parachainId = toChain.paraChainId;
    const rawAmount = amount.toChainData();

    return this.api?.tx.polkadotXcm.limitedReserveTransferAssets(
      createPolkadotXCMDest(this.api, parachainId, 1, "V4"),
      createPolkadotXCMAccount(this.api, accountId, accountType, "V4"),
      createPolkadotXCMAsset(this.api, rawAmount, "NATIVE", "V4"),
      0,
      this.getDestWeight(token, to)?.toString() as any
    );
  }
}

export class CrabAdapter extends BaseDarwiniaAdapter {
  constructor() {
    super(chains.crab, crabRouteConfigs, crabTokensConfig);
  }
}
