import path from 'path';
import { traverseDir } from './traverse-dir';
import { flatten } from 'lodash';
import { writeFileSync, rmSync } from 'fs';

function template (from: string, to: string, token: string) {
  return `| ${from} | ${to} | ${token} |`;
}

function title () {
  return `
# Support Bridges

## Bridges

| From | To | Token |
| --- | --- | --- |`
}

function getSupportBridgesFiles () {
  const files: string[] = [];

  traverseDir(
    path.resolve(__dirname, '../src/adapters'),
    (path) => {
      return path.endsWith('ts')
      && !path.endsWith('configs.ts')
      && !path.endsWith('spec.ts');
    },
    (path) => {
      files.push(path);
    }
  );

  return files;
}

function getRoutes (path: string) {
  const exports = require(path);

  const fileted = Object.entries(exports).filter(([k, v]) => {
    return k.endsWith('RouteConfigs');
  }).map((i) => i[1]) as {from: string, to: string; token: string}[][];

  return flatten(fileted);
}

function createSupportsaDocs (configs: {from: string, to: string; token: string}[][]) {
  const docs: string[] = [];

  docs.push(title());

  configs.forEach((config) => {
    config.forEach((i) => {
      docs.push(template(i.from, i.to, i.token));
    });
  });

  return docs.join('\n');
}

// clean generated docs
function clean () {
  const docs = [
    path.resolve(__dirname, '../docs/support-bridges.md'),
  ];

  docs.forEach((doc) => {
    rmSync(doc);
  });
}

function main () {
  clean();

  const files = getSupportBridgesFiles();
  const configs = files.map(getRoutes);
  const doc = createSupportsaDocs(configs);

  writeFileSync(path.resolve(__dirname, '../docs/support-bridges.md'), doc)
  // write support json to src/support-bridges.json
  writeFileSync(path.resolve(__dirname, '../src/support-bridges.json'), JSON.stringify(configs))
}

main();