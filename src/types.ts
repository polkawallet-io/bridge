import { FixedPointNumber } from "@acala-network/sdk-core";

import { BaseCrossChainAdapter } from "./base-chain-adapter";
import { ChainId } from "./configs";

export { FixedPointNumber as FN } from "@acala-network/sdk-core";

export type ChainType = "substrate" | "ethereum";

export interface Chain {
  // unique chain id
  readonly id: ChainId;
  // chain name for display
  readonly display: string;
  // chain is `substract` or `ethereum` like
  readonly type: ChainType;
  // chain icon resource path
  readonly icon: string;
  // set id to -1 when the chain is para chain
  readonly paraChainId: number;
  // the chain SS58 Prefix
  readonly ss58Prefix: number;
}

export interface BasicToken {
  name: string;
  symbol: string;
  decimals: number;
  ed: string;
}

export interface ExtendedToken extends BasicToken {
  toRaw: () => any;
}

export interface RouteConfigs {
  // from chain name
  from: ChainId;
  // to chain name
  to: ChainId;
  // token name
  token: string;
  // xcm config
  xcm?: XCMTransferConfigs;
}

export interface CrossChainRouter {
  // from chain name
  from: Chain;
  // to chain name
  to: Chain;
  // token name
  token: string;
  // xcm config
  xcm?: XCMTransferConfigs;
}

export interface XCMTransferConfigs {
  // XCM transfer weight limit
  weightLimit?: string | "Unlimited" | "Limited";
  // XCM transfer fee charged by `to chain`
  fee: {
    token: string;
    amount: string;
  };
}

export interface NetworkProps {
  ss58Format: number;
  tokenDecimals: number[];
  tokenSymbol: string[];
}

export interface TransferParams {
  address: string;
  amount: FixedPointNumber;
  to: ChainId;
  token: string;
}

export interface TransferParamsWithSigner extends TransferParams {
  signer: string;
}

export interface InputConfig {
  minInput: FixedPointNumber;
  maxInput: FixedPointNumber;
  ss58Prefix: number;
  destFee: TokenBalance;
  estimateFee: TokenBalance;
  xcmFee: TokenBalance | null;
}

export interface RouterFilter {
  from?: Chain | ChainId;
  to?: Chain | ChainId;
  token?: string;
}

export interface BridgeConfigs {
  adapters: BaseCrossChainAdapter[];
  disabledRouters?: RouterFilter[] | string;
}

export interface BalanceChangeConfig {
  token: string;
  address: string;
  amount: FixedPointNumber;
  tolerance?: number;
  timeout?: number;
}

export enum BalanceChangeStatue {
  "CHECKING",
  "SUCCESS",
  "TIMEOUT",
  "UNKNOWN_ERROR",
}

export interface TokenBalance<T = FixedPointNumber> {
  token: string;
  balance: T;
}

export interface BalanceData {
  free: FixedPointNumber;
  locked: FixedPointNumber;
  reserved: FixedPointNumber;
  available: FixedPointNumber;
}
