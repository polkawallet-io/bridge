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
import {
  BalanceData,
  ExtendedToken,
  RouteConfigs,
  TransferParams,
} from "../types";
import {
  createXTokensDestParam,
  createXTokensWeight,
  isChainEqual,
  validateAddress,
} from "../utils";

const DEST_WEIGHT = "5000000000";

export const pichiuRoutersConfig: Omit<RouteConfigs, "from">[] = [
  {
    to: "karura",
    token: "PCHU",
    xcm: {
      fee: { token: "PCHU", amount: "9324000000000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "karura",
    token: "KAR",
    xcm: {
      fee: { token: "KAR", amount: "9324000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "karura",
    token: "KUSD",
    xcm: {
      fee: { token: "KUSD", amount: "5060238106" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "karura",
    token: "LKSM",
    xcm: {
      fee: { token: "LKSM", amount: "700170039" },
      weightLimit: DEST_WEIGHT,
    },
  },
];

export const pichiuTokensConfig: Record<string, ExtendedToken> = {
  PCHU: {
    name: "PCHU",
    symbol: "PCHU",
    decimals: 18,
    ed: "1000000000000",
    toRaw: () => "PCHU",
  },
  KAR: {
    name: "KAR",
    symbol: "KAR",
    decimals: 12,
    ed: "100000000000",
    toRaw: () => "KAR",
  },
  AUSD: {
    name: "AUSD",
    symbol: "AUSD",
    decimals: 12,
    ed: "10000000000",
    toRaw: () => "AUSD",
  },
  KUSD: {
    name: "KUSD",
    symbol: "KUSD",
    decimals: 12,
    ed: "10000000000",
    toRaw: () => "AUSD",
  },
  LKSM: {
    name: "LKSM",
    symbol: "LKSM",
    decimals: 12,
    ed: "500000000",
    toRaw: () => "LKSM",
  },
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
    assets: (address: string, token: string) =>
      Storage.create<any>({
        api,
        path: "query.ormlTokens.accounts",
        params: [address, token],
      }),
  };
};

class KylinBalanceAdapter extends BalanceAdapter {
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

    if (token === this.nativeToken) {
      return storage.observable.pipe(
        map((data) => ({
          free: FN.fromInner(data.freeBalance.toString(), this.decimals),
          locked: FN.fromInner(data.lockedBalance.toString(), this.decimals),
          reserved: FN.fromInner(
            data.reservedBalance.toString(),
            this.decimals
          ),
          available: FN.fromInner(
            data.availableBalance.toString(),
            this.decimals
          ),
        }))
      );
    }

    const tokenData: ExtendedToken = this.getToken(token);

    if (!tokenData) throw new TokenNotFound(token);

    return this.storages.assets(address, tokenData.toRaw()).observable.pipe(
      map((balance) => {
        const amount = FN.fromInner(
          balance.free?.toString() || "0",
          tokenData.decimals
        );

        return {
          free: amount,
          locked: new FN(0),
          reserved: new FN(0),
          available: amount,
        };
      })
    );
  }
}

class BaseKylinAdapter extends BaseCrossChainAdapter {
  private balanceAdapter?: KylinBalanceAdapter;

  public async init(api: AnyApi) {
    this.api = api;

    await api.isReady;

    this.balanceAdapter = new KylinBalanceAdapter({
      chain: this.chain.id as ChainId,
      api,
      tokens: pichiuTokensConfig,
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
              amount: FN.ZERO,
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

    if (!validateAddress(address)) throw new InvalidAddress(address);

    const tokenData: ExtendedToken = this.getToken(token);
    const toChain = chains[to];
    const accountId = this.api?.createType("AccountId32", address).toHex();
    const isToRelayChain =
      isChainEqual(toChain, "kusama") || isChainEqual(toChain, "polkadot");

    if (!tokenData) throw new TokenNotFound(token);

    return this.api?.tx.ormlXTokens.transfer(
      tokenData.toRaw(),
      amount.toChainData(),
      createXTokensDestParam(this.api, toChain.paraChainId, accountId, {
        isToRelayChain,
      }),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      createXTokensWeight(this.api, this.getDestWeight(token, to)!)
    );
  }
}

export class PichiuAdapter extends BaseKylinAdapter {
  constructor() {
    super(chains.pichiu, pichiuRoutersConfig, pichiuTokensConfig);
  }
}
