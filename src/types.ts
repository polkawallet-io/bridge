import { FixedPointNumber, Token } from '@acala-network/sdk-core';
import { Observable } from 'rxjs';

import { BaseCrossChainAdapter } from './base-chain-adapter';
import { ChainName } from './configs';

export { FixedPointNumber as FN } from '@acala-network/sdk-core';

export type ChainType = 'substract' | 'ethereum';

export interface Chain {
  // unique chain id
  readonly id: ChainName;
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

export interface MultipleChainToken {
  // token name
  name: string;
  // token symbol
  symbol: string;
  // decimals configs in multiple chain, the decimals are same in different chains in most times.
  decimals?: number | { [k in ChainName]: number};
  // existential deposit configs in multiple chain, the ED are same in different chains in most times.
  ed?: bigint | { [k in ChainName]: bigint }
}

export interface CrossChainRouter {
  // from chain name
  from: ChainName;
  // to chain name
  to: ChainName;
  // token name
  token: string;
  // XCM transfer weight limit
  weightLimit: bigint | 'Unlimit';
  // XCM transfer fee charged by `to chain`
  fee: bigint;
}

export interface NetworkProps {
  ss58Format: number;
  tokenDecimals: number[];
  tokenSymbol: string[];
}

export interface CrossChainTransferParams {
  address: string;
  amount: FixedPointNumber;
  to: ChainName;
  token: string;
}

export interface CrossChainInputConfigs {
  minInput: FixedPointNumber;
  maxInput: FixedPointNumber;
  ss58Prefix: number;
  destFee: string;
}

export interface CrossChainFeeConfig {
  fee: string;
  existentialDeposit: string;
  decimals: number;
}

export interface BridgeTxParams {
  module: string;
  call: string;
  params: any[];
}

export interface BridgeConfigs {
  adapters: BaseCrossChainAdapter[];
}

export interface CrossChainBalanceChangedConfigs {
  token: string;
  address: string;
  amount: FixedPointNumber;
  tolerance?: number;
  timeout?: number;
}

export enum BalanceChangedStatus {
  'CHECKING',
  'SUCCESS',
  'TIMEOUT',
  'UNKNOWN_ERROR',
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
  getED(token: Token | string): Observable<FixedPointNumber>;
}
