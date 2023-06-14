import { readdirSync, statSync } from 'fs';

export function traverseDir (
  dir: string,
  filter: (path: string) => boolean,
  callback: (path: string) => void
) {
  const files = readdirSync(dir);

  for (const file of files) {
    const path = `${dir}/${file}`;
    const stat = statSync(path);

    if (stat.isDirectory()) {
      traverseDir(path, filter, callback);
    } else if (filter(path)) {
      callback(path);
    }
  }
}