import { FixedPointNumber, Token } from "@acala-network/sdk-core";
import { Observable } from "rxjs";
import { RegisteredChainName } from "./configs";

export type CROSS_CHAIN_ENV = "kusama" | "polkadot";

export interface Chain {
  readonly id: RegisteredChainName;
  readonly display: string;
  // chain icon resource path
  readonly icon: string;
  // set id to -1 if the chain is para chain
  readonly paraChainId: number;
  readonly ss58Prefix: number;
}

export interface CrossChainRouter {
  from: Chain;
  to: Chain;
  token: string;
}

export interface CrossChainTransferParams {
  amount: FixedPointNumber;
  to: RegisteredChainName;
  token: string;
  address: string;
}

export interface CrossChainInputConfigs {
  minInput: FixedPointNumber;
  maxInput: FixedPointNumber;
  ss58Prefix: number;
}

export interface CrossChainFeeConfig {
  fee: string;
  existentialDeposit: string;
}

export interface BridgeTxParams {
  module: string;
  call: string;
  params: any[];
}

export interface CrossChianBalanceChangedConfigs {
  token: string;
  address: string;
  amount: FixedPointNumber;
  tolerance?: number;
  timeout?: number;
}

export enum BalanceChangedStatus {
  "CHECKING",
  "SUCCESS",
  "TIMEOUT",
  "UNKNOWN_ERROR",
}

export interface TokenBalance {
  token: Token | string;
  balance: FixedPointNumber;
}

export interface BalanceData {
  free: FixedPointNumber;
  locked: FixedPointNumber;
  reserved: FixedPointNumber;
  available: FixedPointNumber;
}

export interface BalanceAdapter {
  subscribeBalance(token: Token | string, address: string): Observable<BalanceData>;
  getED(token: Token | string): FixedPointNumber;
}
