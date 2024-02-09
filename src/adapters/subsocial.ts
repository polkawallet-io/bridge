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
  getDestAccountType,
  getValidDestAddrType,
  validateAddress,
} from "../utils";

export const subsocialRouteConfigs = createRouteConfigs("subsocial" as any, [
  {
    to: "hydradx",
    token: "SUB",
    xcm: {
      fee: { token: "SUB", amount: "65000000" },
    },
  },
  {
    to: "moonbeam",
    token: "SUB",
    xcm: {
      fee: { token: "SUB", amount: "65000000" },
    },
  },
]);

export const subsocialTokensConfig: Record<string, BasicToken> = {
  SUB: { name: "SUB", symbol: "SUB", decimals: 10, ed: "100000000" },
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

class SubsocialBalanceAdapter extends BalanceAdapter {
  private storages: ReturnType<typeof createBalanceStorages>;

  constructor({ api, chain, tokens }: BalanceAdapterConfigs) {
    super({ api, chain, tokens });
    this.storages = createBalanceStorages(api);
  }

  public subscribeBalance(
    token: string,
    address: string
  ): Observable<BalanceData> {
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

class SubsocialBaseAdapter extends BaseCrossChainAdapter {
  private balanceAdapter?: SubsocialBalanceAdapter;

  public async init(api: AnyApi) {
    this.api = api;

    await api.isReady;

    const chain = this.chain.id as ChainId;

    this.balanceAdapter = new SubsocialBalanceAdapter({
      chain,
      api,
      tokens: subsocialTokensConfig,
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
      txFee: this.estimateTxFee({
        amount: FN.ZERO,
        to,
        token,
        address,
        signer: address,
      }),
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

    const addrType = getValidDestAddrType(address, token, to);

    const accountId =
      addrType === "ethereum"
        ? address
        : this.api.createType("AccountId32", address).toHex();

    const accountType = getDestAccountType(address, token, to);

    if (!validateAddress(address, addrType)) throw new InvalidAddress(address);

    const toChain = chains[to];

    if (token !== this.balanceAdapter?.nativeToken) {
      throw new TokenNotFound(token);
    }

    // const accountId = this.api?.createType('AccountId32', address).toHex()
    const paraChainId = toChain.paraChainId;
    const rawAmount = amount.toChainData();

    return this.api?.tx.polkadotXcm.limitedReserveTransferAssets(
      createPolkadotXCMDest(this.api, paraChainId),
      createPolkadotXCMAccount(this.api, accountId, accountType),
      createPolkadotXCMAsset(this.api, rawAmount, "NATIVE"),
      0,
      this.getDestWeight(token, to)?.toString() as any
    );
  }
}

export class SubsocialAdapter extends SubsocialBaseAdapter {
  constructor() {
    super(chains.subsocial, subsocialRouteConfigs, subsocialTokensConfig);
  }
}
