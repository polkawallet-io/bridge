import { ChainId } from "../configs";
import { RouteConfigs } from "../types";

export function createRouteConfigs(
  from: ChainId,
  routes: Omit<RouteConfigs, "from">[]
) {
  return routes.map((route) => ({ ...route, from }));
}
