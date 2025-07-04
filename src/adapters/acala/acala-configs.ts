import { createRouteConfigs } from "../../utils";
import { BasicToken, ExtendedToken } from "../../types";

export const acalaRouteConfigs = createRouteConfigs("acala", [
  {
    to: "polkadot",
    token: "DOT",
    xcm: {
      fee: { token: "DOT", amount: "19978738" },
    },
  },
  {
    to: "moonbeam",
    token: "GLMR",
    xcm: {
      fee: { token: "GLMR", amount: "8000000000000000" },
    },
  },
  {
    to: "moonbeam",
    token: "ACA",
    xcm: {
      fee: { token: "ACA", amount: "24963428577" },
    },
  },
  {
    to: "moonbeam",
    token: "AUSD",
    xcm: {
      fee: { token: "AUSD", amount: "2000000000" },
    },
  },
  {
    to: "moonbeam",
    token: "DOT",
    xcm: {
      fee: { token: "DOT", amount: "447889166" },
    },
  },
  {
    to: "moonbeam",
    token: "LDOT",
    xcm: {
      fee: { token: "LDOT", amount: "45977011" },
    },
  },
  {
    to: "astar",
    token: "ASTR",
    xcm: {
      fee: { token: "ASTR", amount: "4006410300000000" },
    },
  },
  {
    to: "astar",
    token: "ACA",
    xcm: {
      fee: { token: "ACA", amount: "1108000000" },
    },
  },
  {
    to: "astar",
    token: "AUSD",
    xcm: {
      fee: { token: "AUSD", amount: "252800000" },
    },
  },
  {
    to: "astar",
    token: "LDOT",
    xcm: {
      fee: { token: "LDOT", amount: "3692000" },
    },
  },
  {
    to: "interlay",
    token: "INTR",
    xcm: {
      fee: { token: "INTR", amount: "20000000" },
    },
  },
  {
    to: "interlay",
    token: "IBTC",
    xcm: {
      fee: { token: "IBTC", amount: "72" },
    },
  },
  {
    to: "hydradx",
    token: "DAI",
    xcm: {
      fee: { token: "DAI", amount: "2926334210356268" },
    },
  },
  {
    to: "hydradx",
    token: "DOT",
    xcm: {
      fee: { token: "DOT", amount: "491129243" },
    },
  },
  {
    to: "hydradx",
    token: "WETH",
    xcm: {
      fee: { token: "WETH", amount: "956965470918" },
    },
  },
  {
    to: "hydradx",
    token: "WBTC",
    xcm: {
      fee: { token: "WBTC", amount: "6" },
    },
  },
  {
    to: "hydradx",
    token: "LDOT",
    xcm: {
      fee: { token: "LDOT", amount: "11516111" },
    },
  },
  {
    to: "hydradx",
    token: "ACA",
    xcm: {
      fee: { token: "ACA", amount: "10429291793" },
    },
  },
  {
    to: "unique",
    token: "UNQ",
    xcm: {
      fee: { token: "UNQ", amount: "" },
    },
  },
  {
    to: "assetHubPolkadot",
    token: "USDT",
    xcm: {
      fee: { token: "DOT", amount: "160000000" },
    },
  },
  {
    to: "assetHubPolkadot",
    token: "USDC",
    xcm: {
      fee: { token: "DOT", amount: "160000000" },
    },
  },
  {
    to: "assetHubPolkadot",
    token: "PINK",
    xcm: {
      fee: { token: "DOT", amount: "160000000" },
    },
  },
  {
    to: "assetHubPolkadot",
    token: "LOVA",
    xcm: {
      fee: { token: "DOT", amount: "160000000" },
    },
  },
  {
    to: "assetHubPolkadot",
    token: "LOTY",
    xcm: {
      fee: { token: "DOT", amount: "160000000" },
    },
  },
  {
    to: "assetHubPolkadot",
    token: "DAMN",
    xcm: {
      fee: { token: "DOT", amount: "160000000" },
    },
  },
  {
    to: "assetHubPolkadot",
    token: "ETH",
    xcm: {
      fee: { token: "DOT", amount: "160000000" },
    },
  },
]);

export const acalaTokensConfig: Record<string, ExtendedToken | BasicToken> = {
  ACA: {
    name: "ACA",
    symbol: "ACA",
    decimals: 12,
    ed: "100000000000",
    toRaw: () =>
      "0x0000000000000000000000000000000000000000000000000000000000000000",
  },
  AUSD: {
    name: "AUSD",
    symbol: "AUSD",
    decimals: 12,
    ed: "100000000000",
    toRaw: () =>
      "0x0001000000000000000000000000000000000000000000000000000000000000",
  },
  LDOT: {
    name: "LDOT",
    symbol: "LDOT",
    decimals: 10,
    ed: "500000000",
    toRaw: () =>
      "0x0003000000000000000000000000000000000000000000000000000000000000",
  },
  INTR: { name: "INTR", symbol: "INTR", decimals: 10, ed: "1000000000" },
  IBTC: { name: "IBTC", symbol: "IBTC", decimals: 8, ed: "100" },
  GLMR: {
    name: "GLMR",
    symbol: "GLMR",
    decimals: 18,
    ed: "100000000000000000",
    toRaw: () =>
      "0x0500000000000000000000000000000000000000000000000000000000000000",
  },
  PARA: { name: "PARA", symbol: "PARA", decimals: 12, ed: "100000000000" },
  ASTR: {
    name: "ASTR",
    symbol: "ASTR",
    decimals: 18,
    ed: "100000000000000000",
  },
  DOT: {
    name: "DOT",
    symbol: "DOT",
    decimals: 10,
    ed: "100000000",
    toRaw: () =>
      "0x0002000000000000000000000000000000000000000000000000000000000000",
  },
  DAI: {
    name: "DAI",
    symbol: "DAI",
    decimals: 18,
    ed: "10000000000000000",
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
  UNQ: {
    name: "Unique Network",
    symbol: "UNQ",
    decimals: 18,
    ed: "1250000000000000000",
  },
  USDT: {
    name: "USDT",
    symbol: "USDT",
    decimals: 6,
    ed: "700000",
  },
  USDC: {
    name: "USDC",
    symbol: "USDC",
    decimals: 6,
    ed: "10000",
  },
  PINK: {
    name: "PINK",
    symbol: "PINK",
    decimals: 10,
    ed: "1000000000",
  },
  LOVA: {
    name: "LOVA",
    symbol: "LOVA",
    decimals: 12,
    ed: "1",
  },
  LOTY: {
    name: "LOTY",
    symbol: "LOTY",
    decimals: 12,
    ed: "100000000",
  },
  DAMN: {
    name: "DAMN",
    symbol: "DAMN",
    decimals: 12,
    ed: "1",
  },
  ETH: {
    name: "Ether", // foreign asset 21
    symbol: "ETH",
    decimals: 18,
    ed: "10000000000000",
  },
};
