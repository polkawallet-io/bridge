import { FixedPointNumber } from "@acala-network/sdk-core";

import { BaseCrossChainAdapter } from "./base-chain-adapter";
import { ChainName } from "./configs";

export { FixedPointNumber as FN } from "@acala-network/sdk-core";

export type ChainType = "substrate" | "ethereum";

export interface Chain {
  // unique chain id
  readonly id: string;
  // chain name for display
  readonly display: string;
  // chain is `substract` or `ethereum` like
  readonly type: ChainType;
  // chain icon resource path
  readonly icon: string;
  // set id to -1 if the chain is para chain
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

export interface ExpandToken extends BasicToken {
  toChainData: () => any;
}

export interface CrossChainRouterConfigs {
  // from chain name
  from: ChainName;
  // to chain name
  to: ChainName;
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
  weightLimit: string | "Unlimited" | "Limited";
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

export interface CrossChainTransferParams {
  signer: string;
  address: string;
  amount: FixedPointNumber;
  to: ChainName;
  token: string;
}

export interface CrossChainInputConfigs {
  minInput: FixedPointNumber;
  maxInput: FixedPointNumber;
  ss58Prefix: number;
  destFee: TokenBalance;
  estimateFee: string;
}

export interface RouterFilter {
  from?: Chain | ChainName;
  to?: Chain | ChainName;
  token?: string;
}

export interface BridgeConfigs {
  adapters: BaseCrossChainAdapter[];
  routersDisabled?: RouterFilter[];
}

export interface CrossChainBalanceChangedConfigs {
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
