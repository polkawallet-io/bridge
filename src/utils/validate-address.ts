import { encodeAddress, decodeAddress } from "@polkadot/keyring";
import * as ethers from "ethers";

type AddressType = "substract" | "ethereum";

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
