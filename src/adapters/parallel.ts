import { Storage } from "@acala-network/sdk/utils/storage";
import { AnyApi, FixedPointNumber as FN } from "@acala-network/sdk-core";
import { combineLatest, map, Observable } from "rxjs";

import { SubmittableExtrinsic } from "@polkadot/api/types";
import { DeriveBalancesAll } from "@polkadot/api-derive/balances/types";
import { ISubmittableResult } from "@polkadot/types/types";

import { BalanceAdapter, BalanceAdapterConfigs } from "../balance-adapter";
import { BaseCrossChainAdapter } from "../base-chain-adapter";
import { ChainName, chains } from "../configs";
import { ApiNotFound, CurrencyNotFound } from "../errors";
import {
  BalanceData,
  BasicToken,
  CrossChainRouterConfigs,
  CrossChainTransferParams,
} from "../types";
import { xTokensHelper } from "../utils/xtokens-helper";

const DEST_WEIGHT = "Unlimited";

export const parallelRoutersConfig: Omit<CrossChainRouterConfigs, "from">[] = [
  {
    to: "interlay",
    token: "IBTC",
    xcm: {
      // during chopsticks test: fee = 71 Add 10x margin
      fee: { token: "IBTC", amount: "710" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "interlay",
    token: "INTR",
    xcm: {
      // during chopsticks test: fee = 21_660_472 Add 10x margin
      fee: { token: "INTR", amount: "216604720" },
      weightLimit: DEST_WEIGHT,
    },
  },
];

export const heikoRoutersConfig: Omit<CrossChainRouterConfigs, "from">[] = [
  {
    to: "kintsugi",
    token: "KBTC",
    xcm: {
      // chopsticks tests indicate fees are 107
      fee: { token: "KBTC", amount: "1070" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "kintsugi",
    token: "KINT",
    xcm: {
      fee: { token: "KINT", amount: "2471893330" }, // 247189333 fee in recent chopsticks test. Added 10x margin
      weightLimit: DEST_WEIGHT,
    },
  },
];

export const parallelTokensConfig: Record<
  string,
  Record<string, BasicToken>
> = {
  parallel: {
    // ed confirmed via assets.asset(<id>)
    IBTC: { name: "IBTC", symbol: "IBTC", decimals: 8, ed: "1" },
    INTR: { name: "INTR", symbol: "INTR", decimals: 10, ed: "1" },
  },
  heiko: {
    // ed confirmed via assets.asset(<id>)
    KBTC: { name: "KBTC", symbol: "KBTC", decimals: 8, ed: "0" },
    KINT: { name: "Kintsugi", symbol: "KINT", decimals: 12, ed: "0" },
  },
};

const SUPPORTED_TOKENS: Record<string, number> = {
  IBTC: 122, // asset id 122
  INTR: 120, // asset id 120
  KBTC: 121, // asset id 121
  KINT: 119, // asset id 119
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
    assets: (tokenId: number, address: string) =>
      Storage.create<any>({
        api,
        path: "query.assets.account",
        params: [tokenId, address],
      }),
  };
};

class ParallelBalanceAdapter extends BalanceAdapter {
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

    const tokenId = SUPPORTED_TOKENS[token];

    if (tokenId === undefined) {
      throw new CurrencyNotFound(token);
    }

    return this.storages.assets(tokenId, address).observable.pipe(
      map((balance) => {
        const amount = FN.fromInner(
          balance.unwrapOrDefault()?.balance?.toString() || "0",
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

class BaseParallelAdapter extends BaseCrossChainAdapter {
  private balanceAdapter?: ParallelBalanceAdapter;

  public override async setApi(api: AnyApi) {
    this.api = api;

    await api.isReady;

    const chain = this.chain.id as ChainName;

    this.balanceAdapter = new ParallelBalanceAdapter({
      chain,
      api,
      tokens: parallelTokensConfig[chain],
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
    to: ChainName
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
    params: CrossChainTransferParams
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
      throw new CurrencyNotFound(token);
    }

    const dst = xTokensHelper.buildV1orV3Destination(
      this.api,
      accountId,
      toChain
    );

    return this.api.tx.xTokens.transfer(
      tokenId,
      amount.toChainData(),
      dst as any,
      this.getDestWeight(token, to) || "Unlimited"
    );
  }
}

export class HeikoAdapter extends BaseParallelAdapter {
  constructor() {
    super(chains.heiko, heikoRoutersConfig, parallelTokensConfig.heiko);
  }
}

export class ParallelAdapter extends BaseParallelAdapter {
  constructor() {
    super(
      chains.parallel,
      parallelRoutersConfig,
      parallelTokensConfig.parallel
    );
  }
}
