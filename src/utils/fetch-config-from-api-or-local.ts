import axios from "axios";

export async function fetchConfigFromApiOrLocal<T>(
  config: string | T,
  getter?: (i: any) => T
): Promise<T> {
  if (typeof config === "string" && config.startsWith("http")) {
    const data = await axios.get(config);

    return getter ? getter(data.data) : (data.data as unknown as T);
  } else {
    return config as T;
  }
}
