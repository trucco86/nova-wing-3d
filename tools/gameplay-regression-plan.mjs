import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const regressionMemory = JSON.parse(
  readFileSync(new URL('../specs/gameplay-regression-memory.json', import.meta.url), 'utf8'),
);

export function regressionPlan(areas = []) {
  const known = new Set(regressionMemory.map((item) => item.area));
  for (const area of areas) {
    if (!known.has(area)) throw new Error('Unknown gameplay area: ' + area);
  }
  const contracts = regressionMemory.filter((item) => !areas.length || areas.includes(item.area));
  const unique = (field) => [...new Set(contracts.flatMap((item) => item[field]))].sort();
  const node = unique('node');
  const browser = unique('browser');
  return {
    status: 'PLAN_ONLY',
    contracts,
    commands: [
      ...(node.length ? [['node', '--test', ...node]] : []),
      ...(browser.length ? [['npm', 'run', 'test:browser', '--', ...browser]] : []),
    ],
    humanApproval: 'PENDING',
    releaseAuthorized: false,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.stdout.write(JSON.stringify(regressionPlan(process.argv.slice(2)), null, 2) + '\n');
}
