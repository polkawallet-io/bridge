import { AnyApi } from "@acala-network/sdk-core";

import { getValidDestAddrType, AddressType } from "./validate-address";

export const getDestAccountType = (
  address: string,
  token: string,
  to?: string
): "AccountKey20" | "AccountId32" => {
  const addrType = getValidDestAddrType(address, token, to);
  if (addrType === "ethereum") {
    return "AccountKey20";
  } else {
    return "AccountId32";
  }
};

export const getDestAccountId = (
  address: string,
  api: AnyApi,
  token: string,
  to?: string
): `0x${string}` => {
  const addrType = getValidDestAddrType(address, token, to);
  if (addrType === "ethereum") {
    return api.createType("AccountId20", address).toHex();
  } else {
    return api.createType("AccountId32", address).toHex();
  }
};

export const getDestAccountInfo = (
  address: string,
  token: string,
  api: AnyApi,
  to?: string
): {
  addrType: AddressType;
  accountId: `0x${string}`;
  accountType: "AccountKey20" | "AccountId32";
} => {
  return {
    addrType: getValidDestAddrType(address, token, to),
    accountId: getDestAccountId(address, api, token, to),
    accountType: getDestAccountType(address, token, to),
  };
};
