// Developer QA is a local scenario launcher, never a privileged/admin API.
// Excluded from production and HML by an exact hostname allowlist.
export function developerToolsAllowed(hostname, native = false) {
  if (native || typeof hostname !== 'string') return false;
  const host = hostname.toLowerCase();
  return (
    host === 'dev.nova-wing-preview.pages.dev' ||
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
