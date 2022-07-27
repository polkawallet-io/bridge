import { BN } from '@polkadot/util';

import { MultiChainToken } from '../../types';

export const polkadotTokensConfig: Record<string, MultiChainToken> = {
  DOT: { name: 'DOT', symbol: 'DOT', decimals: 10, ed: { polkadot: new BN('10000000000'), acala: new BN('100000000') } },
  KSM: { name: 'KSM',
    symbol: 'KSM',
    decimals: 12,
    ed: {
      kusama: new BN('79999999'),
      statemine: new BN('79999999'),
      karura: new BN('100000000'),
      bifrost: new BN('100000000'),
      calamari: new BN('100000000')
    } }
};

export const statemintTokensConfig: Record<string, MultiChainToken> = {
  RMRK: { name: 'RMRK', symbol: 'RMRK', decimals: 10, ed: { statemine: new BN('100000000'), karura: new BN('100000000') } },
  ARIS: { name: 'ARIS', symbol: 'ARIS', decimals: 8, ed: { statemine: new BN('10000000'), karura: new BN('1000000000000') } },
  USDT: { name: 'USDT', symbol: 'USDT', decimals: 8, ed: { statemine: new BN('1000'), karura: new BN('1000') } }
};
