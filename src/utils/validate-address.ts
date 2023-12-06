import { encodeAddress, decodeAddress } from "@polkadot/keyring";
import * as ethers from "ethers";

export type AddressType = "substract" | "ethereum";

export const SUPPORTED_TOKEN_ERC20: {
  [x in string]?: { [y: string]: string };
} = {
  karura: {
    TAI: "0x0000000000000000000100000000000000000084",
    tKSM: "0x0000000000000000000300000000000000000000",
    KAR: "0x0000000000000000000100000000000000000080",
    LKSM: "0x0000000000000000000100000000000000000083",
    aUSD: "0x0000000000000000000100000000000000000081",
    aSEED: "0x0000000000000000000100000000000000000081",
    KSM: "0x0000000000000000000100000000000000000082",
    USDCet: "0x1f3a10587a20114ea25ba1b388ee2dd4a337ce27",
  },
  acala: {
    tDOT: "0x0000000000000000000300000000000000000000",
    aUSD: "0x0000000000000000000100000000000000000001",
    aSEED: "0x0000000000000000000100000000000000000001",
    ACA: "0x0000000000000000000100000000000000000000",
    DOT: "0x0000000000000000000100000000000000000002",
    LDOT: "0x0000000000000000000100000000000000000003",
    USDCet: "0x07DF96D1341A7d16Ba1AD431E2c847d978BC2bCe",
  },
  mandala: {},
};

const isSupportedErc20 = (toChain: string, tokenName: string) => {
  const supportedTokens = Object.keys(SUPPORTED_TOKEN_ERC20[toChain] || {}).map(
    (token) => token.toUpperCase()
  );
  return supportedTokens.includes(tokenName.toUpperCase());
};

/**
 * Get the valid destination address type for the given combination of
 * address, token name and destination chain name.
 *
 * Return "ethereum" or "substract",
 * only acala or karura supports ethereum address type as destination.
 *
 * @param address account address
 * @param token token name in string
 * @param to destination chain name
 */
export const getValidDestAddrType = (
  address: string,
  token: string,
  to?: string
): AddressType => {
  if (
    (to === "acala" || to === "karura") &&
    address.startsWith("0x") &&
    isSupportedErc20(to, token)
  ) {
    return "ethereum";
  }
  return "substract";
};

function validateEthereumAddress(address: string) {
  return ethers.utils.isAddress(address);
}

function validateSubstrateAddress(address: string) {
  try {
    encodeAddress(decodeAddress(address));

    return true;
  } catch (e) {
    // ignore error
  }

  return false;
}

export function validateAddress(
  address: string,
  type: AddressType = "substract"
) {
  if (type === "ethereum") return validateEthereumAddress(address);

  return validateSubstrateAddress(address);
}
