import { CrossChainRouterConfigs, FN } from '../../types';

export const moonbeamRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  moonriver: [
    { to: 'karura', token: 'MOVR', xcm: { fee: { token: 'DOT', balance: new FN('64000000000000') }, weightLimit: new FN(5_000_000_000) } }
  ],
  moonbeam: [
    { to: 'acala', token: 'GLMR', xcm: { fee: { token: 'DOT', balance: new FN('6400000000000000') }, weightLimit: new FN(5_000_000_000) } }
  ]
  // moonriver: {
  //   MOVR: { fee: '80000000000000', existentialDeposit: '1000000000000000', decimals: 18 },
  //   KAR: { fee: '9880000000', existentialDeposit: '0', decimals: 12 },
  //   KUSD: { fee: '16536000000', existentialDeposit: '0', decimals: 12 }
  // },
  // moonbeam: {
  //   GLMR: { fee: '8000000000000000', existentialDeposit: '100000000000000000', decimals: 18 },
  //   ACA: { fee: '24963428577', existentialDeposit: '100000000000', decimals: 12 },
  //   AUSD: { fee: '2000000000', existentialDeposit: '100000000000', decimals: 12 }
  // }
};
