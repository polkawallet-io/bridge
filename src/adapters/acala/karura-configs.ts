import { createRouteConfigs } from "../../utils";
import { BasicToken } from "../../types";

export const karuraRouteConfigs = createRouteConfigs("karura", [
  {
    to: "kusama",
    token: "KSM",
    xcm: {
      fee: { token: "KSM", amount: "79999999" },
    },
  },
  {
    to: "statemine",
    token: "RMRK",
    xcm: {
      fee: { token: "RMRK", amount: "100000" },
    },
  },
  {
    to: "statemine",
    token: "ARIS",
    xcm: {
      fee: { token: "KSM", amount: "16000000000" },
    },
  },
  {
    to: "statemine",
    token: "USDT",
    xcm: {
      fee: { token: "USDT", amount: "1183" },
    },
  },
  {
    to: "shiden",
    token: "SDN",
    xcm: {
      fee: { token: "SDN", amount: "3519949300000000" },
    },
  },
  {
    to: "shiden",
    token: "KUSD",
    xcm: {
      fee: { token: "KUSD", amount: "2080000000" },
    },
  },
  {
    to: "bifrost",
    token: "BNC",
    xcm: {
      fee: { token: "BNC", amount: "5120000000" },
    },
  },
  {
    to: "bifrost",
    token: "KSM",
    xcm: {
      fee: { token: "KSM", amount: "5120000000" },
    },
  },
  {
    to: "bifrost",
    token: "KAR",
    xcm: {
      fee: { token: "KAR", amount: "4800000000" },
    },
  },
  {
    to: "bifrost",
    token: "KUSD",
    xcm: {
      fee: { token: "KUSD", amount: "25600000000" },
    },
  },
  {
    to: "bifrost",
    token: "VSKSM",
    xcm: {
      fee: { token: "VSKSM", amount: "64000000" },
    },
  },
  {
    to: "altair",
    token: "AIR",
    xcm: {
      fee: { token: "AIR", amount: "9269600000000000" },
    },
  },
  {
    to: "altair",
    token: "KUSD",
    xcm: {
      fee: { token: "KUSD", amount: "51200000000" },
    },
  },
  {
    to: "shadow",
    token: "CSM",
    xcm: {
      fee: { token: "CSM", amount: "4000000000" },
    },
  },
  {
    to: "shadow",
    token: "KAR",
    xcm: {
      fee: { token: "KAR", amount: "4000" },
    },
  },
  {
    to: "shadow",
    token: "KUSD",
    xcm: {
      fee: { token: "KUSD", amount: "4000" },
    },
  },
  {
    to: "crab",
    token: "CRAB",
    xcm: {
      fee: { token: "CRAB", amount: "4000000000" },
    },
  },
  {
    to: "integritee",
    token: "TEER",
    xcm: {
      fee: { token: "TEER", amount: "4000000" },
    },
  },
  {
    to: "kintsugi",
    token: "KINT",
    xcm: {
      fee: { token: "KINT", amount: "220000000" },
    },
  },
  {
    to: "kintsugi",
    token: "KBTC",
    xcm: {
      fee: { token: "KBTC", amount: "85" },
    },
  },
  {
    to: "kintsugi",
    token: "LKSM",
    xcm: {
      fee: { token: "LKSM", amount: "190000000" },
    },
  },
  {
    to: "khala",
    token: "PHA",
    xcm: {
      fee: { token: "PHA", amount: "64000000000" },
    },
  },
  {
    to: "khala",
    token: "KUSD",
    xcm: {
      fee: { token: "KUSD", amount: "16000000000" },
    },
  },
  {
    to: "khala",
    token: "KAR",
    xcm: {
      fee: { token: "KAR", amount: "8000000000" },
    },
  },
  {
    to: "kico",
    token: "KICO",
    xcm: {
      fee: { token: "KICO", amount: "96000000000" },
    },
  },
  {
    to: "kico",
    token: "KAR",
    xcm: {
      fee: { token: "KAR", amount: "160000000000" },
    },
  },
  {
    to: "kico",
    token: "KUSD",
    xcm: {
      fee: { token: "KUSD", amount: "320000000000" },
    },
  },
  {
    to: "calamari",
    token: "KSM",
    xcm: {
      fee: { token: "KSM", amount: "100000000000" },
    },
  },
  {
    to: "calamari",
    token: "KMA",
    xcm: {
      fee: { token: "KMA", amount: "4000000" },
    },
  },
  {
    to: "calamari",
    token: "KUSD",
    xcm: {
      fee: { token: "KUSD", amount: "100000000000" },
    },
  },
  {
    to: "calamari",
    token: "KAR",
    xcm: {
      fee: { token: "KAR", amount: "100000000000" },
    },
  },
  {
    to: "calamari",
    token: "LKSM",
    xcm: {
      fee: { token: "LKSM", amount: "7692307692" },
    },
  },
  {
    to: "moonriver",
    token: "MOVR",
    xcm: {
      fee: { token: "MOVR", amount: "80000000000000" },
    },
  },
  {
    to: "moonriver",
    token: "KAR",
    xcm: {
      fee: { token: "KAR", amount: "9880000000" },
    },
  },
  {
    to: "moonriver",
    token: "KUSD",
    xcm: {
      fee: { token: "KUSD", amount: "16536000000" },
    },
  },
  {
    to: "heiko",
    token: "HKO",
    xcm: {
      fee: { token: "HKO", amount: "1440000000" },
    },
  },
  {
    to: "heiko",
    token: "KAR",
    xcm: {
      fee: { token: "KAR", amount: "2400000000" },
    },
  },
  {
    to: "heiko",
    token: "LKSM",
    xcm: {
      fee: { token: "LKSM", amount: "48000000" },
    },
  },
  {
    to: "heiko",
    token: "KUSD",
    xcm: {
      fee: { token: "KUSD", amount: "48000000" },
    },
  },
  {
    to: "pichiu",
    token: "PCHU",
    xcm: {
      fee: { token: "PCHU", amount: "400000000000000" },
    },
  },
  {
    to: "pichiu",
    token: "KAR",
    xcm: {
      fee: { token: "KAR", amount: "400000000" },
    },
  },
  {
    to: "pichiu",
    token: "KUSD",
    xcm: {
      fee: { token: "KUSD", amount: "400000000" },
    },
  },
  {
    to: "pichiu",
    token: "LKSM",
    xcm: {
      fee: { token: "LKSM", amount: "400000000" },
    },
  },
  {
    to: "turing",
    token: "TUR",
    xcm: {
      fee: { token: "TUR", amount: "1664000000" },
    },
  },
  {
    to: "turing",
    token: "KAR",
    xcm: {
      fee: { token: "KAR", amount: "32000000000" },
    },
  },
  {
    to: "turing",
    token: "KUSD",
    xcm: {
      fee: { token: "KUSD", amount: "256000000000" },
    },
  },
  {
    to: "turing",
    token: "LKSM",
    xcm: {
      fee: { token: "LKSM", amount: "6400000000" },
    },
  },
  {
    to: "basilisk",
    token: "BSX",
    xcm: {
      fee: { token: "BSX", amount: "22000000000000" },
    },
  },
  {
    to: "basilisk",
    token: "KSM",
    xcm: {
      fee: { token: "KSM", amount: "359882060" },
    },
  },
  {
    to: "basilisk",
    token: "KUSD",
    xcm: {
      fee: { token: "KUSD", amount: "3150402683" },
    },
  },
  {
    to: "basilisk",
    token: "DAI",
    xcm: {
      fee: { token: "DAI", amount: "4400000000000000" },
    },
  },
  {
    to: "basilisk",
    token: "USDCet",
    xcm: {
      fee: { token: "USDCet", amount: "4400" },
    },
  },
  {
    to: "basilisk",
    token: "WETH",
    xcm: {
      fee: { token: "WETH", amount: "2926000000000" },
    },
  },
  {
    to: "basilisk",
    token: "WBTC",
    xcm: {
      fee: { token: "WBTC", amount: "22" },
    },
  },
  {
    to: "listen",
    token: "LT",
    xcm: {
      fee: { token: "LT", amount: "6400000000" },
    },
  },
  {
    to: "listen",
    token: "KAR",
    xcm: {
      fee: { token: "KAR", amount: "6400000000" },
    },
  },
  {
    to: "listen",
    token: "KUSD",
    xcm: {
      fee: { token: "KUSD", amount: "6400000000" },
    },
  },
  {
    to: "listen",
    token: "LKSM",
    xcm: {
      fee: { token: "LKSM", amount: "6400000000" },
    },
  },
  {
    to: "quartz",
    token: "QTZ",
    xcm: { fee: { token: "QTZ", amount: "0" } },
  },
]);

export const karuraTokensConfig: Record<string, BasicToken> = {
  KAR: { name: "KAR", symbol: "KAR", decimals: 12, ed: "100000000000" },
  // kusd, ausd, aseed are same
  KUSD: { name: "KUSD", symbol: "KUSD", decimals: 12, ed: "10000000000" },
  aUSD: { name: "aUSD", symbol: "aUSD", decimals: 12, ed: "10000000000" },
  aSEED: { name: "aSEED", symbol: "aSEED", decimals: 12, ed: "10000000000" },
  LKSM: { name: "LKSM", symbol: "LKSM", decimals: 12, ed: "500000000" },
  SDN: { name: "SDN", symbol: "SDN", decimals: 18, ed: "10000000000000000" },
  BNC: { name: "BNC", symbol: "BNC", decimals: 12, ed: "8000000000" },
  VSKSM: { name: "VSKSM", symbol: "VSKSM", decimals: 12, ed: "100000000" },
  AIR: { name: "AIR", symbol: "AIR", decimals: 18, ed: "100000000000000000" },
  CSM: { name: "CSM", symbol: "CSM", decimals: 12, ed: "1000000000000" },
  CRAB: {
    name: "CRAB",
    symbol: "CRAB",
    decimals: 18,
    ed: "1000000000000000000",
  },
  BSX: { name: "BSX", symbol: "BSX", decimals: 12, ed: "1000000000000" },
  TEER: { name: "TEER", symbol: "TEER", decimals: 12, ed: "100000000000" },
  KINT: { name: "KINT", symbol: "KINT", decimals: 12, ed: "133330000" },
  KBTC: { name: "KBTC", symbol: "KBTC", decimals: 8, ed: "66" },
  KICO: { name: "KICO", symbol: "KICO", decimals: 14, ed: "100000000000000" },
  PCHU: {
    name: "PCHU",
    symbol: "PCHU",
    decimals: 18,
    ed: "100000000000000000",
  },
  LT: { name: "LT", symbol: "LT", decimals: 12, ed: "1000000000000" },
  KMA: { name: "KMA", symbol: "KMA", decimals: 12, ed: "100000000000" },
  MOVR: { name: "MOVR", symbol: "MOVR", decimals: 18, ed: "1000000000000000" },
  TUR: { name: "TUR", symbol: "TUR", decimals: 10, ed: "40000000000" },
  HKO: { name: "HKO", symbol: "HKO", decimals: 12, ed: "100000000000" },
  PHA: { name: "PHA", symbol: "PHA", decimals: 12, ed: "40000000000" },
  KSM: { name: "KSM", symbol: "KSM", decimals: 12, ed: "100000000" },
  RMRK: { name: "RMRK", symbol: "RMRK", decimals: 10, ed: "100000000" },
  ARIS: { name: "ARIS", symbol: "ARIS", decimals: 8, ed: "1000000000000" },
  USDT: { name: "USDT", symbol: "USDT", decimals: 6, ed: "10000" },
  QTZ: { name: "QTZ", symbol: "QTZ", decimals: 18, ed: "1000000000000000000" },
  DAI: {
    name: "DAI",
    symbol: "DAI",
    decimals: 18,
    ed: "10000000000000000",
  },
  USDCet: {
    name: "USDCet",
    symbol: "USDCet",
    decimals: 6,
    ed: "10000",
  },
  WETH: {
    name: "WETH",
    symbol: "WETH",
    decimals: 18,
    ed: "5555555555555",
  },
  WBTC: {
    name: "WBTC",
    symbol: "WBTC",
    decimals: 8,
    ed: "35",
  },
};
