import { RegisteredChainName } from "../configs";
import { Chain } from "../types";

export function isChainEqual(c1: Chain | RegisteredChainName, c2: Chain | RegisteredChainName): boolean {
  const c1Name = typeof c1 === "string" ? c1 : c1.id;
  const c2Name = typeof c2 === "string" ? c2 : c2.id;

  return c1Name.toLowerCase() === c2Name.toLowerCase();
}
