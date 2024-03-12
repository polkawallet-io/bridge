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
  createRouteConfigs,
  getDestAccountInfo,
  validateAddress,
} from "../utils";
import {
  BalanceData,
  BasicToken,
  ExtendedToken,
  TransferParams,
} from "src/types";

export const moonbeamRouteConfigs = createRouteConfigs("moonbeam", [
  {
    to: "subsocial",
    token: "xcSUB",
    xcm: {
      fee: { token: "SUB", amount: "1000000000" },
    },
  },
  {
    to: "acala",
    token: "GLMR",
    xcm: {
      fee: { token: "GLMR", amount: "1000000000" },
    },
  },
  {
    to: "acala",
    token: "xcACA",
    xcm: {
      fee: { token: "ACA", amount: "1000000000" },
    },
  },
  {
    to: "acala",
    token: "xcaUSD",
    xcm: {
      fee: { token: "AUSD", amount: "1000000000" },
    },
  },
  {
    to: "acala",
    token: "xcDOT",
    xcm: {
      fee: { token: "DOT", amount: "1000000000" },
    },
  },
  {
    to: "assetHubPolkadot",
    token: "xcUSDT",
    xcm: {
      fee: { token: "USDT", amount: "1000000000" },
    },
  },
]);

const moonbeamTokensConfig: Record<string, ExtendedToken> = {
  GLMR: {
    name: "GLMR",
    symbol: "GLMR",
    decimals: 18,
    ed: "10000000000000000000",
    toRaw: () => ({
      ForeignAsset: "0x0000000000000000000000000000000000000802",
    }),
  },
  SUB: {
    name: "SUB",
    symbol: "SUB",
    decimals: 10,
    ed: "100000000000",
    toRaw: () => ({
      ForeignAsset: "89994634370519791027168048838578580624",
    }),
  },
  DOT: {
    name: "DOT",
    symbol: "DOT",
    decimals: 10,
    ed: "10000000000",
    toRaw: () => ({
      ForeignAsset: "42259045809535163221576417993425387648",
    }),
  },
  LDOT: {
    name: "LDOT",
    symbol: "LDOT",
    decimals: 10,
    ed: "500000000",
    toRaw: () => ({
      ForeignAsset: "22571952218199846829411730904177935381",
    }),
  },
  ACA: {
    name: "ACA",
    symbol: "ACA",
    decimals: 12,
    ed: "10000000000",
    toRaw: () => ({
      ForeignAsset: "224821240862170613278369189818311486111",
    }),
  },
  AUSD: {
    name: "AUSD",
    symbol: "AUSD",
    decimals: 12,
    ed: "10000000000",
    toRaw: () => ({
      ForeignAsset: "110021739665376159354538090254163045594",
    }),
  },
  USDT: {
    name: "USDT",
    symbol: "USDT",
    decimals: 6,
    ed: "10000000000",
    toRaw: () => ({
      ForeignAsset: "311091173110107856861649819128533077277",
    }),
  },
};

export const moonriverTokensConfig: Record<string, BasicToken> = {
  MOVR: { name: "MOVR", symbol: "MOVR", decimals: 18, ed: "1000000000000000" },
  KAR: { name: "KAR", symbol: "KAR", decimals: 12, ed: "0" },
  KSM: { name: "KSM", symbol: "KSM", decimals: 12, ed: "10000000000" },
  KUSD: { name: "KUSD", symbol: "KUSD", decimals: 12, ed: "0" },
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

class MoonbeamBalanceAdapter extends BalanceAdapter {
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

class MoonbeamBaseAdapter extends BaseCrossChainAdapter {
  private balanceAdapter?: MoonbeamBalanceAdapter;

  public async init(api: AnyApi) {
    this.api = api;

    await api.isReady;

    const chain = this.chain.id as ChainId;

    this.balanceAdapter = new MoonbeamBalanceAdapter({
      chain,
      api,
      tokens: moonbeamTokensConfig,
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
    if (this.api === undefined) {
      throw new ApiNotFound(this.chain.id);
    }

    const { address, amount, to, token } = params;

    const { accountId, accountType, addrType } = getDestAccountInfo(
      address,
      token,
      this.api,
      to
    );

    const tokenData = moonbeamTokensConfig[token.replace("xc", "")];

    if (!validateAddress(address, addrType)) throw new InvalidAddress(address);

    const toChain = chains[to];

    return this.api.tx.xTokens.transfer(
      tokenData.toRaw(),
      amount.toChainData(),
      {
        V3: {
          parents: 1,
          interior: {
            X2: [
              { Parachain: toChain.paraChainId },
              { [accountType]: { id: accountId, network: undefined } },
            ],
          },
        },
      } as any,
      "Unlimited"
    );
  }
}

export class MoonbeamAdapter extends MoonbeamBaseAdapter {
  constructor() {
    super(chains.moonbeam, moonbeamRouteConfigs, moonbeamTokensConfig);
  }
}

export class MoonriverAdapter extends MoonbeamBaseAdapter {
  constructor() {
    super(chains.moonriver, [], moonriverTokensConfig);
  }
}
