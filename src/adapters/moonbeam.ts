import { AnyApi, FixedPointNumber as FN } from "@acala-network/sdk-core";
import { Observable } from "rxjs";

import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";

import { BaseCrossChainAdapter } from "../base-chain-adapter";
import { ChainId, chains } from "../configs";
import { ApiNotFound } from "../errors";
import { BalanceData, BasicToken, TransferParams } from "../types";

export const moonbeamTokensConfig: Record<string, BasicToken> = {
  GLMR: {
    name: "GLMR",
    symbol: "GLMR",
    decimals: 18,
    ed: "100000000000000000",
  },
  ACA: { name: "ACA", symbol: "ACA", decimals: 12, ed: "100000000000" },
  AUSD: { name: "AUSD", symbol: "AUSD", decimals: 12, ed: "100000000000" },
  LDOT: { name: "LDOT", symbol: "LDOT", decimals: 10, ed: "500000000" },
  DOT: { name: "DOT", symbol: "DOT", decimals: 10, ed: "10000000000" },
};

export const moonriverTokensConfig: Record<string, BasicToken> = {
  MOVR: { name: "MOVR", symbol: "MOVR", decimals: 18, ed: "1000000000000000" },
  KAR: { name: "KAR", symbol: "KAR", decimals: 12, ed: "0" },
  KUSD: { name: "KUSD", symbol: "KUSD", decimals: 12, ed: "0" },
};

class BaseMoonbeamAdapter extends BaseCrossChainAdapter {
  public subscribeTokenBalance(_: string, __: string): Observable<BalanceData> {
    throw new ApiNotFound(this.chain.id);
  }

  public async init(api: AnyApi) {
    this.api = api;
  }

  public subscribeMaxInput(
    _: string,
    __: string,
    ___: ChainId
  ): Observable<FN> {
    throw new ApiNotFound(this.chain.id);
  }

  public createTx(
    _: TransferParams
  ):
    | SubmittableExtrinsic<"promise", ISubmittableResult>
    | SubmittableExtrinsic<"rxjs", ISubmittableResult> {
    throw new ApiNotFound(this.chain.id);
  }
}

export class MoonbeamAdapter extends BaseMoonbeamAdapter {
  constructor() {
    super(chains.moonbeam, [], moonbeamTokensConfig);
  }
}

export class MoonriverAdapter extends BaseMoonbeamAdapter {
  constructor() {
    super(chains.moonriver, [], moonriverTokensConfig);
  }
}
