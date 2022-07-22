import { FN, MultiChainToken } from '../../types';

export const polkadotTokensConfig: Record<string, MultiChainToken> = {
  DOT: { name: 'DOT', symbol: 'DOT', decimals: 10, ed: { polkadot: new FN('10000000000'), acala: new FN('1000000000') } },
  KSM: { name: 'KSM',
    symbol: 'KSM',
    decimals: 12,
    ed: {
      kusama: new FN('79999999'),
      karura: new FN('100000000'),
      bifrost: new FN('100000000'),
      calamari: new FN('100000000')
    } }
};

export const statemintTokensConfig: Record<string, MultiChainToken> = {
  RMRK: { name: 'RMRK', symbol: 'RMRK', decimals: 10, ed: { statemine: new FN('100000000'), karura: new FN('100000000') } },
  ARIS: { name: 'ARIS', symbol: 'ARIS', decimals: 8, ed: { statemine: new FN('10000000'), karura: new FN('1000000000000') } },
  USDT: { name: 'USDT', symbol: 'USDT', decimals: 8, ed: { statemine: new FN('1000'), karura: new FN('1000') } }
};
