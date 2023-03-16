import { ChainType } from "src/types";

const typeSubstrate: ChainType = "substrate";
const typeEthereum: ChainType = "ethereum";

export const polkadotChains = {
  polkadot: {
    display: "Polkadot",
    type: typeSubstrate,
    icon: "https://resources.acala.network/_next/image?url=%2Fnetworks%2Fpolkadot.png&w=96&q=75",
    paraChainId: -1,
    ss58Prefix: 0,
  },
  statemint: {
    display: "Statemint",
    type: typeSubstrate,
    icon: "https://resources.acala.network/_next/image?url=%2Fnetworks%2Fstatemine.png&w=96&q=75",
    paraChainId: 1000,
    ss58Prefix: 0,
  },
  acala: {
    display: "Acala",
    type: typeSubstrate,
    icon: "https://resources.acala.network/_next/image?url=%2Fnetworks%2Facala.png&w=96&q=75",
    paraChainId: 2000,
    ss58Prefix: 10,
  },
  parallel: {
    display: "Parallel",
    type: typeSubstrate,
    icon: "https://resources.acala.network/_next/image?url=%2Fnetworks%2Fparallel.png&w=96&q=75",
    paraChainId: 2012,
    ss58Prefix: 172,
  },
  moonbeam: {
    display: "Moonbeam",
    type: typeEthereum,
    icon: "https://resources.acala.network/_next/image?url=%2Fnetworks%2Fmoonbeam.png&w=96&q=75",
    paraChainId: 2004,
    ss58Prefix: 1284,
  },
  interlay: {
    display: "Interlay",
    type: typeSubstrate,
    icon: "https://resources.acala.network/_next/image?url=%2Fnetworks%2Finterlay.png&w=96&q=75",
    paraChainId: 2032,
    ss58Prefix: 2032,
  },
  astar: {
    display: "Astar",
    type: typeSubstrate,
    icon: "https://resources.acala.network/_next/image?url=%2Fnetworks%2Fastar.png&w=96&q=75",
    paraChainId: 2006,
    ss58Prefix: 5,
  },
  hydra: {
    display: "HydraDX",
    type: typeSubstrate,
    icon: "https://resources.acala.network/_next/image?url=%2Fnetworks%2Fhydra.png&w=96&q=75",
    paraChainId: 2034,
    ss58Prefix: 63,
  },
};
