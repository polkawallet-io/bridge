import { Storage } from "@acala-network/sdk/utils/storage";
import { AnyApi, FixedPointNumber as FN } from "@acala-network/sdk-core";
import { combineLatest, map, Observable } from "rxjs";

import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";

import { BalanceAdapter, BalanceAdapterConfigs } from "../balance-adapter";
import { BaseCrossChainAdapter } from "../base-chain-adapter";
import { ChainId, chains } from "../configs";
import { ApiNotFound, TokenNotFound } from "../errors";
import {
  BalanceData,
  BasicToken,
  RouteConfigs,
  TransferParams,
} from "../types";

const DEST_WEIGHT = "Unlimited";

export const bifrostRoutersConfig: Omit<RouteConfigs, "from">[] = [
  {
    to: "karura",
    token: "BNC",
    xcm: {
      fee: { token: "BNC", amount: "5120000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "karura",
    token: "VSKSM",
    xcm: {
      fee: { token: "VSKSM", amount: "64000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "karura",
    token: "KSM",
    xcm: {
      fee: { token: "KSM", amount: "64000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "karura",
    token: "KAR",
    xcm: {
      fee: { token: "KAR", amount: "6400000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "karura",
    token: "KUSD",
    xcm: {
      fee: { token: "KUSD", amount: "10011896008" },
      weightLimit: DEST_WEIGHT,
    },
  },
];

export const bifrostTokensConfig: Record<string, BasicToken> = {
  BNC: { name: "BNC", symbol: "BNC", decimals: 12, ed: "10000000000" },
  VSKSM: { name: "VSKSM", symbol: "VSKSM", decimals: 12, ed: "100000000" },
  KSM: { name: "KSM", symbol: "KSM", decimals: 12, ed: "100000000" },
  KAR: { name: "KAR", symbol: "KAR", decimals: 12, ed: "148000000" },
  KUSD: { name: "KUSD", symbol: "KUSD", decimals: 12, ed: "100000000" },
};

const SUPPORTED_TOKENS: Record<string, unknown> = {
  KUSD: { Stable: "KUSD" },
  AUSD: { Stable: "AUSD" },
  BNC: { Native: "BNC" },
  VSKSM: { VSToken: "KSM" },
  KSM: { Token: "KSM" },
  KAR: { Token: "KAR" },
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const createBalanceStorages = (api: AnyApi) => {
  return {
    balances: (address: string) =>
      Storage.create<any>({
        api,
        path: "query.system.account",
        params: [address],
      }),
    assets: (address: string, token: unknown) =>
      Storage.create<any>({
        api,
        path: "query.tokens.accounts",
        params: [address, token],
      }),
  };
};

class BifrostBalanceAdapter extends BalanceAdapter {
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

    if (token === this.nativeToken) {
      return storage.observable.pipe(
        map(({ data }) => ({
          free: FN.fromInner(data.free.toString(), this.decimals),
          locked: FN.fromInner(data.miscFrozen.toString(), this.decimals),
          reserved: FN.fromInner(data.reserved.toString(), this.decimals),
          available: FN.fromInner(
            data.free.sub(data.miscFrozen).toString(),
            this.decimals
          ),
        }))
      );
    }

    const tokenId = SUPPORTED_TOKENS[token];

    if (tokenId === undefined) {
      throw new TokenNotFound(token);
    }

    return this.storages.assets(address, tokenId).observable.pipe(
      map((balance) => {
        const amount = FN.fromInner(
          balance.free?.toString() || "0",
          this.getToken(token).decimals
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

class BaseBifrostAdapter extends BaseCrossChainAdapter {
  private balanceAdapter?: BifrostBalanceAdapter;

  public async init(api: AnyApi) {
    this.api = api;

    await api.isReady;

    this.balanceAdapter = new BifrostBalanceAdapter({
      chain: this.chain.id as ChainId,
      api,
      tokens: bifrostTokensConfig,
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
    if (this.api === undefined) {
      throw new ApiNotFound(this.chain.id);
    }

    const { address, amount, to, token } = params;
    const toChain = chains[to];

    const accountId = this.api?.createType("AccountId32", address).toHex();

    const tokenId = SUPPORTED_TOKENS[token];

    if (tokenId === undefined) {
      throw new TokenNotFound(token);
    }

    const useNewDestWeight =
      this.api.tx.xTokens.transfer.meta.args[3].type.toString() ===
      "XcmV2WeightLimit";
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const oldDestWeight = this.getDestWeight(token, to)!.toString();
    const destWeight = useNewDestWeight ? "Unlimited" : oldDestWeight;

    return this.api.tx.xTokens.transfer(
      tokenId,
      amount.toChainData(),
      {
        V1: {
          parents: 1,
          interior: {
            X2: [
              { Parachain: toChain.paraChainId },
              { AccountId32: { id: accountId, network: "Any" } },
            ],
          },
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      destWeight
    );
  }
}

export class BifrostAdapter extends BaseBifrostAdapter {
  constructor() {
    super(chains.bifrost, bifrostRoutersConfig, bifrostTokensConfig);
  }
}
