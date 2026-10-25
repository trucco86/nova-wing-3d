# Release preparation — single-source versioning

The Nova Wing repository requires all distributed changes to increment the semantic version. An iOS build number mismatch previously blocked CI even for Web features. The helper now synchronizes **package, npm lockfile, iOS Xcode metadata, changelog header, release notes and generated HTML** in one command.

## Usage

```sh
npm ci
npm run release:prepare -- 1.24.3
# Replace release-note placeholders with actual functionality and limitations.
npm run format
npm run validate
npm run validate -- --browser
git status --short
```

Run this **before committing a change to src/**, not after waiting for GitHub CI to fail. The helper:

- Validates MAJOR.MINOR.PATCH and rejects downgrade.
- Updates both Xcode configurations (`MARKETING_VERSION` and `CURRENT_PROJECT_VERSION`) using the numeric formula used by `tests/ios.test.mjs`.
- Synchronizes the root entries of `package-lock.json` without reinstalling dependencies.
- Inserts only a **draft** changelog/notes section; it never claims that functionality is approved.
- Executes `npm run build` to regenerate the versioned `index.html`. Test and review the generated diff.

It is **idempotent** for an already prepared version, so a repeat invocation doesn't duplicate headers. It does not publish, merge or reconfigure environments.

The helper is deliberately explicit: **do not silently bump package versions in CI** and do not remove version contracts to force a green build. Each PR must still pass the quality and browser gates of its final SHA.
