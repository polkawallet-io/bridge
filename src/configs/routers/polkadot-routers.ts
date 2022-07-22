import { CrossChainRouterConfigs, FN } from '../../types';

export const polkadotRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  polkadot: [
    { to: 'acala', token: 'DOT', xcm: { fee: { token: 'DOT', balance: new FN('4285630') }, weightLimit: new FN(5_000_000_000) } }
  ],
  kusama: [
    { to: 'karura', token: 'KSM', xcm: { fee: { token: 'DOT', balance: new FN('64000000') }, weightLimit: new FN(5_000_000_000) } }
  ]
  // polkadot: {
  //   DOT: { fee: '482771104', existentialDeposit: '10000000000', decimals: 10 }
  // },
  // kusama: {
  //   KSM: { fee: '79999999', existentialDeposit: '33333333', decimals: 12 }
  // }
};

export const statemineRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  statemine: [
    { to: 'kusama', token: 'KSM', xcm: { fee: { token: 'DOT', balance: new FN('64000000') }, weightLimit: new FN(5_000_000_000) } },
    { to: 'karura', token: 'RMRK', xcm: { fee: { token: 'DOT', balance: new FN('64000000') }, weightLimit: new FN(5_000_000_000) } }
  ]
  // statemine: {
  //   KSM: { fee: '4000000000', existentialDeposit: '33333333', decimals: 12 },
  //   RMRK: { fee: '16000000000', existentialDeposit: '100000000', decimals: 10 },
  //   USDT: { fee: '16000000000', existentialDeposit: '1000', decimals: 8 },
  //   ARIS: { fee: '16000000000', existentialDeposit: '10000000', decimals: 8 }
  // }
};
