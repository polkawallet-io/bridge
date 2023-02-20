import { ChainType } from "../../types";

const typeSubstrate: ChainType = "substrate";
// commented for now. We will use eth chain types soon™
// const typeEthereum: ChainType = "ethereum";

export const kusamaChains = {
  kusama: {
    id: "kusama",
    display: "Kusama",
    type: typeSubstrate,
    icon: "https://resources.acala.network/_next/image?url=%2Fnetworks%2Fkusama.png&w=96&q=75",
    paraChainId: -1,
    ss58Prefix: 2,
  },
  statemine: {
    id: "statemine",
    display: "Statemine",
    type: typeSubstrate,
    icon: "https://resources.acala.network/_next/image?url=%2Fnetworks%2Fstatemine.png&w=96&q=75",
    paraChainId: 1000,
    ss58Prefix: 2,
  },
  karura: {
    id: "karura",
    display: "Karura",
    type: typeSubstrate,
    icon: "https://resources.acala.network/_next/image?url=%2Fnetworks%2Fkarura.png&w=96&q=75",
    paraChainId: 2000,
    ss58Prefix: 8,
  },
  // bifrost: {
  //   id: "bifrost",
  //   display: "Bifrost",
  //   type: typeSubstrate,
  //   icon: "https://resources.acala.network/_next/image?url=%2Fnetworks%2Fbifrost.png&w=96&q=75",
  //   paraChainId: 2001,
  //   ss58Prefix: 6,
  // },
  kintsugi: {
    id: "kintsugi",
    display: "Kintsugi",
    type: typeSubstrate,
    icon: "https://resources.acala.network/_next/image?url=%2Fnetworks%2Fkintsugi.png&w=96&q=75",
    paraChainId: 2092,
    ss58Prefix: 2092,
  },
  // moonriver: {
  //   id: "moonriver",
  //   display: "Moonriver",
  //   type: typeEthereum,
  //   icon: "https://resources.acala.network/_next/image?url=%2Fnetworks%2Fmoonriver.png&w=96&q=75",
  //   paraChainId: 2023,
  //   ss58Prefix: 1285,
  // },
  // heiko: {
  //   id: "heiko",
  //   display: "Parallel Heiko",
  //   type: typeSubstrate,
  //   icon: "https://resources.acala.network/_next/image?url=%2Fnetworks%2Fparallel.png&w=96&q=75",
  //   paraChainId: 2085,
  //   ss58Prefix: 110,
  // },
};

export const kusamaTestnetChains = {
  kusama: {
    id: "kusama",
    display: "Kusama",
    type: typeSubstrate,
    icon: "https://resources.acala.network/_next/image?url=%2Fnetworks%2Fkusama.png&w=96&q=75",
    paraChainId: -1,
    ss58Prefix: 2,
  },
  statemine: {
    id: "statemine",
    display: "Statemine",
    type: typeSubstrate,
    icon: "https://resources.acala.network/_next/image?url=%2Fnetworks%2Fstatemine.png&w=96&q=75",
    paraChainId: 1000,
    ss58Prefix: 2,
  },
  karura: {
    id: "karura",
    display: "Karura",
    type: typeSubstrate,
    icon: "https://resources.acala.network/_next/image?url=%2Fnetworks%2Fkarura.png&w=96&q=75",
    paraChainId: 2000,
    ss58Prefix: 8,
  },
  // bifrost: {
  //   id: "bifrost",
  //   display: "Bifrost",
  //   type: typeSubstrate,
  //   icon: "https://resources.acala.network/_next/image?url=%2Fnetworks%2Fbifrost.png&w=96&q=75",
  //   paraChainId: 2001,
  //   ss58Prefix: 6,
  // },
  kintsugi: {
    id: "kintsugi",
    display: "Kintsugi",
    type: typeSubstrate,
    icon: "https://resources.acala.network/_next/image?url=%2Fnetworks%2Fkintsugi.png&w=96&q=75",
    paraChainId: 2092,
    ss58Prefix: 2092,
  },
  // moonriver: {
  //   id: "moonriver",
  //   display: "Moonriver",
  //   type: typeEthereum,
  //   icon: "https://resources.acala.network/_next/image?url=%2Fnetworks%2Fmoonriver.png&w=96&q=75",
  //   paraChainId: 2023,
  //   ss58Prefix: 1285,
  // },
  // heiko: {
  //   id: "heiko",
  //   display: "Parallel Heiko",
  //   type: typeSubstrate,
  //   icon: "https://resources.acala.network/_next/image?url=%2Fnetworks%2Fparallel.png&w=96&q=75",
  //   paraChainId: 2085,
  //   ss58Prefix: 110,
  // },
};
