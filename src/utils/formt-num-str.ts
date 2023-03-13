export function formatNumStr(v: string | number) {
  if (typeof v === "number") return v;

  return v.replace(/,/g, "");
}
