
import { CrossChainRouterConfigs, FN } from '../../types';

export const polkadotRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  polkadot: [
    { to: 'acala', token: 'DOT', xcm: { fee: { token: 'DOT', balance: FN.fromInner('4285630', 10) }, weightLimit: 'Unlimited' } }
  ],
  kusama: [
    { to: 'karura', token: 'KSM', xcm: { fee: { token: 'KSM', balance: FN.fromInner('64000000', 12) }, weightLimit: 'Unlimited' } },
    { to: 'statemine', token: 'KSM', xcm: { fee: { token: 'KSM', balance: FN.fromInner('4000000000', 12) }, weightLimit: 'Unlimited' } }
  ]
};

export const statemineRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  statemine: [
    { to: 'kusama', token: 'KSM', xcm: { fee: { token: 'KSM', balance: FN.fromInner('106666660', 12) }, weightLimit: 'Unlimited' } },
    { to: 'karura', token: 'RMRK', xcm: { fee: { token: 'RMRK', balance: FN.fromInner('6400000', 10) }, weightLimit: 'Unlimited' } },
    { to: 'karura', token: 'ARIS', xcm: { fee: { token: 'ARIS', balance: FN.fromInner('6400000', 8) }, weightLimit: 'Unlimited' } },
    { to: 'karura', token: 'USDT', xcm: { fee: { token: 'USDT', balance: FN.fromInner('640', 8) }, weightLimit: 'Unlimited' } }
  ]
};
