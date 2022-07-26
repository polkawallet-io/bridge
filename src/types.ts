import { FixedPointNumber } from '@acala-network/sdk-core';

import { BN } from '@polkadot/util';

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

export interface MultiChainToken {
  // token name
  name: string;
  // token symbol
  symbol: string;
  // decimals configs in multiple chain, the decimals are same in different chains in most times.
  decimals: number | Partial<{ [k in ChainName]: number}>;
  // existential deposit configs in multiple chain, the ED are same in different chains in most times.
  ed: BN | Partial<{ [k in ChainName]: BN }>
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
  weightLimit: BN | 'Unlimited' | 'Limited';
  // XCM transfer fee charged by `to chain`
  fee: TokenBalance;
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

// export interface CrossChainFeeConfig {
//   fee: string;
//   existentialDeposit: string;
//   decimals: number;
// }

// export interface BridgeTxParams {
//   module: string;
//   call: string;
//   params: any[];
// }

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
  token: string;
  balance: FixedPointNumber;
}

export interface BalanceData {
  free: FixedPointNumber;
  locked: FixedPointNumber;
  reserved: FixedPointNumber;
  available: FixedPointNumber;
}
