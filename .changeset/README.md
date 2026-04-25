# Changesets

This folder controls package versioning and release notes.

## Create a changeset

```bash
npm run changeset
```

Pick the package (`emailcraft`), select semver bump type, and write a short summary.

## Version packages

```bash
npm run version-packages
```

This updates `package.json` version(s) and `CHANGELOG.md`.

## Publish

```bash
npm run release
```

In CI, publishing is handled by the release workflow.
