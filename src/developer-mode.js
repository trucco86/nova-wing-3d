// Developer QA is a local scenario launcher, never a privileged/admin API.
// Excluded from production and HML by an exact hostname allowlist.
export function developerToolsAllowed(hostname, native = false) {
  if (native || typeof hostname !== 'string') return false;
  const host = hostname.toLowerCase();
  return (
    host === 'dev.nova-wing-preview.pages.dev' ||
    // Approved QA build and its stable branch alias; never enable HML or PROD.
    host === '52fd04c6.nova-wing-preview.pages.dev' ||
    host === 'feat-mars-43-sand-fog-no-rin.nova-wing-preview.pages.dev' ||
    host === 'feat-planetary-journeys-2026.nova-wing-preview.pages.dev' ||
    host === 'feat-planetary-visual-polish.nova-wing-preview.pages.dev' ||
    // Strictly this integrated QA alias; production and HML remain blocked.
    host === 'integration-boss-worlds-qa-2.nova-wing-preview.pages.dev' ||
    // Only the verified rival/mothership candidate is allowed to launch QA stages.
    host === 'feat-mothership-marvin-rival.nova-wing-preview.pages.dev' ||
    host === 'feat-mothership-boarding-cin.nova-wing-preview.pages.dev' ||
    host === 'fix-stage4-camera-encounter.nova-wing-preview.pages.dev' ||
    host === 'fix-qa-browser-stage4-lab-re.nova-wing-preview.pages.dev' ||
    /^pr-[0-9]+\.nova-wing-preview\.pages\.dev$/.test(host) ||
    host === 'localhost' ||
    host === '127.0.0.1'
  );
}

export const DEVELOPER_ENCOUNTERS = Object.freeze(['stage', 'subboss', 'boss']);

export function parseDeveloperScenario(sector, encounter, sectorCount) {
  const index = Number(sector);
  if (!Number.isInteger(index) || index < 0 || index >= sectorCount) return null;
  if (!DEVELOPER_ENCOUNTERS.includes(encounter)) return null;
  return { sector: index, encounter };
}
