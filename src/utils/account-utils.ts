import { AnyApi } from "@acala-network/sdk-core";

import { AddressType } from "./validate-address";

export const getAddressType = (address: string, to?: string): AddressType => {
  if (address.startsWith("0x") && (to === "acala" || to === "karura")) {
    return "ethereum";
  }
  return "substract";
};

export const getAccountType = (
  address: string,
  to?: string
): "AccountKey20" | "AccountId32" => {
  const addrType = getAddressType(address, to);
  if (addrType === "ethereum") {
    return "AccountKey20";
  } else {
    return "AccountId32";
  }
};

export const getAccountId = (
  address: string,
  api: AnyApi,
  to?: string
): `0x${string}` => {
  const addrType = getAddressType(address, to);
  if (addrType === "ethereum") {
    return api.createType("AccountId20", address).toHex();
  } else {
    return api.createType("AccountId32", address).toHex();
  }
};

export const getAccountInfo = (
  address: string,
  api: AnyApi,
  to?: string
): {
  addrType: AddressType;
  accountId: `0x${string}`;
  accountType: "AccountKey20" | "AccountId32";
} => {
  return {
    addrType: getAddressType(address, to),
    accountId: getAccountId(address, api, to),
    accountType: getAccountType(address, to),
  };
};
