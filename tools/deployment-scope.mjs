import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

// Exactly the files copied to public-site by the Pages job in ci.yml.
// Changes elsewhere still receive full CI, but do not redeploy identical bytes.
export const PUBLISHED_WEB_FILES = Object.freeze([
  'index.html',
  '.nojekyll',
  'LICENSE',
  'docs/THREE-LICENSE.txt',
  'docs/control-center/index.html',
]);

const validCommit = (sha) =>
  typeof sha === 'string' && /^[0-9a-f]{40}$/i.test(sha) && !/^0+$/.test(sha);

export function decidePagesDeployment({
  eventName,
  beforeSha,
  currentSha,
  changedFiles = [],
  diffAvailable = true,
}) {
  // Explicit manual CI runs on main retain the ability to redeploy intentionally.
  if (eventName !== 'push') {
    return { deploy: true, reason: 'Manual or non-push run; preserve explicit deployment' };
  }
  // Fail open: missing/invalid ancestry must never silently suppress delivery.
  if (!validCommit(beforeSha) || !validCommit(currentSha) || !diffAvailable) {
    return { deploy: true, reason: 'Missing or unreadable push diff; publish safely' };
  }
  const changedPublicFiles = changedFiles.filter((file) => PUBLISHED_WEB_FILES.includes(file));
  return {
    deploy: changedPublicFiles.length > 0,
    reason: changedPublicFiles.length
      ? 'Published web files changed: ' + changedPublicFiles.join(', ')
      : 'No published web files changed; skip redundant deployment',
  };
}

export function evaluateGitHubDelivery(env = process.env) {
  const { GITHUB_EVENT_NAME: eventName, NOVA_BEFORE_SHA: beforeSha, GITHUB_SHA: currentSha } = env;
  let changedFiles = [];
  let diffAvailable = true;
  if (eventName === 'push' && validCommit(beforeSha) && validCommit(currentSha)) {
    try {
      changedFiles = execFileSync(
        'git',
        ['diff', '--name-only', '-z', beforeSha, currentSha, '--'],
        { encoding: 'utf8', timeout: 15000 },
      )
        .split('\0')
        .filter(Boolean);
    } catch (error) {
      diffAvailable = false;
      process.stderr.write('[delivery-scope] git diff unavailable: ' + error.message + '\n');
    }
  }
  const decision = decidePagesDeployment({
    eventName,
    beforeSha,
    currentSha,
    changedFiles,
    diffAvailable,
  });
  if (env.GITHUB_OUTPUT) {
    appendFileSync(env.GITHUB_OUTPUT, 'deploy=' + decision.deploy + '\n');
  }
  process.stdout.write('[delivery-scope] ' + JSON.stringify(decision) + '\n');
  return decision;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  evaluateGitHubDelivery();
}
