export function formateRouteLogLine(
  token: string,
  from: string,
  to: string,
  method: string
) {
  return `| ${token.padEnd(8, " ")} | ${from.padEnd(10, " ")} -> ${to.padEnd(
    10,
    " "
  )} | ${method.padEnd(12, " ")} ✅ |`;
}

export function logFormatedRoute(prefix: string, content: string[]) {
  const divider = " ".padEnd(content[0].length, "-");
  console.log(`${prefix}${divider}\n${content.join("\n")}\n${divider}\n`);
}
