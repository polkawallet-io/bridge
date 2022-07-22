import { CrossChainRouterConfigs, FN } from '../../types';

export const interlayRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  kintsugi: [
    { to: 'karura', token: 'KINT', xcm: { fee: { token: 'DOT', balance: new FN('170666666') }, weightLimit: new FN(5_000_000_000) } }
  ],
  interlay: [
    { to: 'karura', token: 'INTR', xcm: { fee: { token: 'DOT', balance: new FN('93240000') }, weightLimit: new FN(5_000_000_000) } }
  ]
  // kintsugi: {
  //   KINT: { fee: '170666666', existentialDeposit: '0', decimals: 12 },
  //   KBTC: { fee: '85', existentialDeposit: '0', decimals: 8 }
  // },
  // interlay: {
  //   INTR: { fee: '21787589', existentialDeposit: '0', decimals: 10 },
  //   IBTC: { fee: '85', existentialDeposit: '0', decimals: 8 }
  // }
};
