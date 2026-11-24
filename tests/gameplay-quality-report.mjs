export function gameplayReport({
  scenario,
  project,
  viewport,
  commit,
  checks,
  checkpoints,
  error,
  reviews = [],
}) {
  const findings = checks.filter((check) => !check.ok);
  const incomplete = !checks.length || !checkpoints.length;
  return {
    schemaVersion: 1,
    mode: 'advisory',
    scenario,
    project,
    viewport,
    commit: commit || null,
    status: error || incomplete
      ? 'BLOCKED'
      : findings.length
        ? 'FINDINGS'
        : reviews.length
          ? 'REVIEW_REQUIRED'
          : 'OBSERVED_OK',
    checks,
    checkpoints,
    findings,
    reviews,
    error: error || (incomplete ? 'Missing observations' : null),
    humanApproval: 'PENDING',
    releaseAuthorized: false,
  };
}
