import { BN } from '@polkadot/util';

import { CrossChainRouterConfigs, FN } from '../../types';

const ACALA_DEST_WEIGHT = new BN(5_000_000_000);

export const acalaRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  acala: [
    { to: 'polkadot', token: 'DOT', xcm: { fee: { token: 'DOT', balance: FN.fromInner('482771104', 10) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'moonbeam', token: 'GLMR', xcm: { fee: { token: 'GLMR', balance: FN.fromInner('8000000000000000', 18) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'moonbeam', token: 'ACA', xcm: { fee: { token: 'ACA', balance: FN.fromInner('24963428577', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'moonbeam', token: 'AUSD', xcm: { fee: { token: 'AUSD', balance: FN.fromInner('2000000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'parallel', token: 'PARA', xcm: { fee: { token: 'PARA', balance: FN.fromInner('9600000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'parallel', token: 'ACA', xcm: { fee: { token: 'ACA', balance: FN.fromInner('1920000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'parallel', token: 'AUSD', xcm: { fee: { token: 'AUSD', balance: FN.fromInner('2880000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'parallel', token: 'LDOT', xcm: { fee: { token: 'LDOT', balance: FN.fromInner('96000000', 10) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'interlay', token: 'INTR', xcm: { fee: { token: 'INTR', balance: FN.fromInner('21787589', 10) }, weightLimit: ACALA_DEST_WEIGHT } }
  ]
};

export const karuraRoutersConfig: Record<string, Omit<CrossChainRouterConfigs, 'from'>[]> = {
  karura: [
    { to: 'kusama', token: 'KSM', xcm: { fee: { token: 'KSM', balance: FN.fromInner('79999999', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'statemine', token: 'RMRK', xcm: { fee: { token: 'KSM', balance: FN.fromInner('16000000000', 10) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'statemine', token: 'ARIS', xcm: { fee: { token: 'KSM', balance: FN.fromInner('16000000000', 8) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'statemine', token: 'USDT', xcm: { fee: { token: 'KSM', balance: FN.fromInner('16000000000', 8) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'shiden', token: 'SDN', xcm: { fee: { token: 'SDN', balance: FN.fromInner('4662276356431024', 18) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'shiden', token: 'KUSD', xcm: { fee: { token: 'KUSD', balance: FN.fromInner('1200000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'bifrost', token: 'BNC', xcm: { fee: { token: 'BNC', balance: FN.fromInner('5120000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'bifrost', token: 'KAR', xcm: { fee: { token: 'KAR', balance: FN.fromInner('4800000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'bifrost', token: 'KUSD', xcm: { fee: { token: 'KUSD', balance: FN.fromInner('25600000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'bifrost', token: 'VSKSM', xcm: { fee: { token: 'VSKSM', balance: FN.fromInner('64000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'altair', token: 'AIR', xcm: { fee: { token: 'AIR', balance: FN.fromInner('6400000000000000', 18) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'altair', token: 'KUSD', xcm: { fee: { token: 'KUSD', balance: FN.fromInner('51200000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'shadow', token: 'CSM', xcm: { fee: { token: 'CSM', balance: FN.fromInner('4000000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'crab', token: 'CRAB', xcm: { fee: { token: 'CRAB', balance: FN.fromInner('4000000000', 18) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'integritee', token: 'TEER', xcm: { fee: { token: 'TEER', balance: FN.fromInner('4000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'kintsugi', token: 'KINT', xcm: { fee: { token: 'KINT', balance: FN.fromInner('170666666', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'kintsugi', token: 'KBTC', xcm: { fee: { token: 'KBTC', balance: FN.fromInner('85', 8) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'khala', token: 'PHA', xcm: { fee: { token: 'PHA', balance: FN.fromInner('64000000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'khala', token: 'KUSD', xcm: { fee: { token: 'KUSD', balance: FN.fromInner('16000000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'khala', token: 'KAR', xcm: { fee: { token: 'KAR', balance: FN.fromInner('8000000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'kico', token: 'KICO', xcm: { fee: { token: 'KICO', balance: FN.fromInner('96000000000', 14) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'kico', token: 'KAR', xcm: { fee: { token: 'KAR', balance: FN.fromInner('160000000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'kico', token: 'KUSD', xcm: { fee: { token: 'KUSD', balance: FN.fromInner('320000000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'calamari', token: 'KMA', xcm: { fee: { token: 'KMA', balance: FN.fromInner('4000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'calamari', token: 'KUSD', xcm: { fee: { token: 'KUSD', balance: FN.fromInner('100000000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'calamari', token: 'KAR', xcm: { fee: { token: 'KAR', balance: FN.fromInner('100000000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'calamari', token: 'LKSM', xcm: { fee: { token: 'LKSM', balance: FN.fromInner('7692307692', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'moonriver', token: 'MOVR', xcm: { fee: { token: 'MOVR', balance: FN.fromInner('80000000000000', 18) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'moonriver', token: 'KAR', xcm: { fee: { token: 'KAR', balance: FN.fromInner('9880000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'moonriver', token: 'KUSD', xcm: { fee: { token: 'KUSD', balance: FN.fromInner('16536000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'heiko', token: 'HKO', xcm: { fee: { token: 'HKO', balance: FN.fromInner('1440000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'heiko', token: 'KAR', xcm: { fee: { token: 'KAR', balance: FN.fromInner('2400000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'heiko', token: 'KUSD', xcm: { fee: { token: 'KUSD', balance: FN.fromInner('19200000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'heiko', token: 'LKSM', xcm: { fee: { token: 'LKSM', balance: FN.fromInner('48000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'pichiu', token: 'PCHU', xcm: { fee: { token: 'PCHU', balance: FN.fromInner('400000000000000', 18) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'pichiu', token: 'KAR', xcm: { fee: { token: 'KAR', balance: FN.fromInner('400000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'pichiu', token: 'KUSD', xcm: { fee: { token: 'KUSD', balance: FN.fromInner('400000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'pichiu', token: 'LKSM', xcm: { fee: { token: 'LKSM', balance: FN.fromInner('400000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'turing', token: 'TUR', xcm: { fee: { token: 'TUR', balance: FN.fromInner('1664000000', 10) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'turing', token: 'KAR', xcm: { fee: { token: 'KAR', balance: FN.fromInner('32000000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'turing', token: 'KUSD', xcm: { fee: { token: 'KUSD', balance: FN.fromInner('256000000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'turing', token: 'LKSM', xcm: { fee: { token: 'LKSM', balance: FN.fromInner('6400000000', 12) }, weightLimit: ACALA_DEST_WEIGHT } },
    { to: 'quartz', token: 'QTZ', xcm: { fee: { token: 'QTZ', balance: FN.fromInner('0', 18) }, weightLimit: ACALA_DEST_WEIGHT } }
  ]
};
