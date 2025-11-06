import { Storage } from "@acala-network/sdk/utils/storage";
import { AnyApi, FixedPointNumber as FN } from "@acala-network/sdk-core";
import { combineLatest, map, Observable } from "rxjs";

import { SubmittableExtrinsic } from "@polkadot/api/types";
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

const DEST_WEIGHT = "180000000000";

export const interlayRoutersConfig: Omit<CrossChainRouterConfigs, "from">[] = [
  {
    to: "acala",
    token: "INTR",
    xcm: {
      // during chopsticks test: fee = 80_824_000. Add 10x margin
      fee: { token: "INTR", amount: "808240000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "acala",
    token: "IBTC",
    // during chopsticks test: fee = 8. Add 10x margin
    xcm: { fee: { token: "IBTC", amount: "80" }, weightLimit: DEST_WEIGHT },
  },
  {
    to: "astar",
    token: "INTR",
    xcm: {
      // from recent xcm transfer: fee = 38360000 - Add 10x margin
      fee: { token: "INTR", amount: "383600000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "astar",
    token: "IBTC",
    // from chopsticks: fee = 4 - Add 10x margin
    xcm: { fee: { token: "IBTC", amount: "40" }, weightLimit: DEST_WEIGHT },
  },
  {
    to: "parallel",
    token: "INTR",
    xcm: {
      // during chopsticks test: fee = 6_535_947_712 Add 10x margin
      fee: { token: "INTR", amount: "65359477120" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "parallel",
    token: "IBTC",
    // during chopsticks test: fee = 103 Add 10x margin
    xcm: { fee: { token: "IBTC", amount: "1030" }, weightLimit: DEST_WEIGHT },
  },
  {
    to: "phala",
    token: "PHA",
    xcm: {
      // chopsticks test data: 64_296_000_000, use ~2.5x buffer
      fee: { token: "PHA", amount: "150000000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "phala",
    token: "INTR",
    xcm: {
      // chopsticks test data: fee = 642_960_000, use ~10x buffer
      fee: { token: "INTR", amount: "6400000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "phala",
    token: "IBTC",
    xcm: {
      // chopsticks test: fee = 6429600. Use ~3x buffer
      fee: { token: "IBTC", amount: "20000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "statemint",
    token: "DOT",
    xcm: {
      fee: { token: "DOT", amount: "1000000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "statemint",
    token: "USDC",
    xcm: {
      // seen on subscan: 70_000 atomic units, need a minimum of 2x as buffer
      fee: { token: "USDC", amount: "150000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "statemint",
    token: "USDT",
    xcm: {
      // fees from tests with chopsticks: 700_000 atomic units, need a minimum of 2x as buffer
      fee: { token: "USDT", amount: "1500000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "hydra",
    token: "IBTC",
    // recent xcm fees: 7 - add 10x safety margin
    xcm: { fee: { token: "IBTC", amount: "70" }, weightLimit: DEST_WEIGHT },
  },
  {
    to: "hydra",
    token: "INTR",
    // in chopsticks tests: 1_577_910_765 - add 10x safety margin
    xcm: {
      fee: { token: "INTR", amount: "15779107650" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "hydra",
    token: "HDX",
    // from recent transfer: 80_376_806_468 - add 5x safety margin
    xcm: {
      fee: { token: "HDX", amount: "400000000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  // {
  //   to: "hydra",
  //   token: "USDC",
  //   xcm: {
  //     // seen on subscan: 2_732 atomic units, need a minimum of 2x as buffer
  //     fee: { token: "USDC", amount: "10000" },
  //     weightLimit: DEST_WEIGHT,
  //   },
  // },
  {
    to: "bifrost_polkadot",
    token: "VDOT",
    xcm: {
      // from actual transaction: fee = 703. Add 10x margin
      fee: { token: "VDOT", amount: "7030" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "bifrost_polkadot",
    token: "BNC",
    xcm: {
      // chopsticks test value: 514_368_000, add buffer
      fee: { token: "BNC", amount: "5000000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
];

export const kintsugiRoutersConfig: Omit<CrossChainRouterConfigs, "from">[] = [
  {
    to: "karura",
    token: "KBTC",
    xcm: {
      // local tests in chopsticks indicate fees are around 21 (atomic units)
      fee: { token: "KBTC", amount: "100" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "karura",
    token: "KINT",
    xcm: {
      // local tests in chopsticks indicate fees are around 250k (atomic units)
      // use value rounded up * 10 to account for KINT price fluctations
      fee: { token: "KINT", amount: "3000000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "karura",
    token: "LKSM",
    xcm: {
      // fees in chopsticks tests: 463_749_148
      fee: { token: "LKSM", amount: "1000000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "statemine",
    token: "KSM",
    xcm: {
      fee: { token: "KSM", amount: "1000000000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "statemine",
    token: "USDT",
    xcm: {
      // fees in tests: 7_186, need a minimum of 2x as safe buffer
      fee: { token: "USDT", amount: "20000" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "heiko",
    token: "KBTC",
    xcm: {
      // from local tests on choptsicks: actual fees sat around 103
      fee: { token: "KBTC", amount: "1030" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "heiko",
    token: "KINT",
    xcm: {
      // recent fee during chopsticks test: fee = 16634783331. Added 10x margin
      fee: { token: "KINT", amount: "166347833310" },
      weightLimit: DEST_WEIGHT,
    },
  },
  {
    to: "bifrost",
    token: "VKSM",
    xcm: {
      // during chopsticks test: fee = 80_824_000. Add 10x margin
      fee: { token: "VKSM", amount: "808240000" },
      weightLimit: DEST_WEIGHT,
    },
  },
];

export const interlayTokensConfig: Record<
  string,
  Record<string, BasicToken>
> = {
  interlay: {
    DOT: { name: "DOT", symbol: "DOT", decimals: 10, ed: "0" },
    IBTC: { name: "IBTC", symbol: "IBTC", decimals: 8, ed: "0" },
    INTR: { name: "INTR", symbol: "INTR", decimals: 10, ed: "0" },
    USDC: { name: "USDC", symbol: "USDC", decimals: 6, ed: "0" },
    USDT: { name: "USDT", symbol: "USDT", decimals: 6, ed: "0" },
    VDOT: { name: "VDOT", symbol: "VDOT", decimals: 10, ed: "0" },
    BNC: { name: "BNC", symbol: "BNC", decimals: 12, ed: "0" },
    HDX: { name: "HDX", symbol: "HDX", decimals: 12, ed: "0" },
    PHA: { name: "PHA", symbol: "PHA", decimals: 12, ed: "10000000000" },
  },
  kintsugi: {
    KBTC: { name: "KBTC", symbol: "KBTC", decimals: 8, ed: "0" },
    KINT: { name: "KINT", symbol: "KINT", decimals: 12, ed: "0" },
    KSM: { name: "KSM", symbol: "KSM", decimals: 12, ed: "0" },
    LKSM: { name: "LKSM", symbol: "LKSM", decimals: 12, ed: "0" },
    USDT: { name: "USDT", symbol: "USDT", decimals: 6, ed: "0" },
    VKSM: { name: "VKSM", symbol: "VKSM", decimals: 12, ed: "0" },
  },
};

const KINTSUGI_SUPPORTED_TOKENS: Record<string, unknown> = {
  KBTC: { Token: "KBTC" },
  KINT: { Token: "KINT" },
  KSM: { Token: "KSM" },
  LKSM: { ForeignAsset: 2 },
  USDT: { ForeignAsset: 3 },
  VKSM: { ForeignAsset: 5 },
};

const INTERLAY_SUPPORTED_TOKENS: Record<string, unknown> = {
  DOT: { Token: "DOT" },
  IBTC: { Token: "IBTC" },
  INTR: { Token: "INTR" },
  USDT: { ForeignAsset: 2 },
  VDOT: { ForeignAsset: 3 },
  BNC: { ForeignAsset: 11 },
  USDC: { ForeignAsset: 12 },
  HDX: { ForeignAsset: 13 },
  PHA: { ForeignAsset: 14 },
};

const getSupportedTokens = (chainname: string): Record<string, unknown> => {
  return chainname === "interlay"
    ? INTERLAY_SUPPORTED_TOKENS
    : KINTSUGI_SUPPORTED_TOKENS;
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const createBalanceStorages = (api: AnyApi) => {
  return {
    assets: (address: string, token: unknown) =>
      Storage.create<any>({
        api,
        path: "query.tokens.accounts",
        params: [address, token],
      }),
  };
};

class InterlayBalanceAdapter extends BalanceAdapter {
  private storages: ReturnType<typeof createBalanceStorages>;

  constructor({ api, chain, tokens }: BalanceAdapterConfigs) {
    super({ api, chain, tokens });
    this.storages = createBalanceStorages(api);
  }

  public subscribeBalance(
    token: string,
    address: string
  ): Observable<BalanceData> {
    const tokenId = getSupportedTokens(this.chain)[token];

    if (tokenId === undefined) {
      throw new CurrencyNotFound(token);
    }

    return this.storages.assets(address, tokenId).observable.pipe(
      map((balance) => {
        const free = FN.fromInner(
          balance.free?.toString() || "0",
          this.getToken(token).decimals
        );

        const frozen = FN.fromInner(
          balance.frozen?.toString() || "0",
          this.getToken(token).decimals
        );

        const reserved = FN.fromInner(
          balance.reserved?.toString() || "0",
          this.getToken(token).decimals
        );

        const available = free.sub(frozen);

        return {
          free,
          locked: frozen,
          reserved,
          available,
        };
      })
    );
  }
}

class BaseInterlayAdapter extends BaseCrossChainAdapter {
  private balanceAdapter?: InterlayBalanceAdapter;

  public override async setApi(api: AnyApi) {
    this.api = api;

    await api.isReady;

    const chain = this.chain.id as ChainName;

    this.balanceAdapter = new InterlayBalanceAdapter({
      chain,
      api,
      tokens: interlayTokensConfig[chain],
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

    const accountId = this.api.createType("AccountId32", address).toHex();

    const tokenId = getSupportedTokens(this.chain.id)[token];

    return xTokensHelper.transfer(
      this.api,
      this.chain,
      toChain,
      accountId,
      token,
      tokenId,
      amount,
      this.getDestWeight(token, to) || "Unlimited"
    );
  }
}

export class InterlayAdapter extends BaseInterlayAdapter {
  constructor() {
    super(
      chains.interlay,
      interlayRoutersConfig,
      interlayTokensConfig.interlay
    );
  }
}

export class KintsugiAdapter extends BaseInterlayAdapter {
  constructor() {
    super(
      chains.kintsugi,
      kintsugiRoutersConfig,
      interlayTokensConfig.kintsugi
    );
  }
}
