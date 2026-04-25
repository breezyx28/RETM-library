# Changelog

All notable changes to this project are documented in this file.

The format is based on Keep a Changelog and follows Semantic Versioning.

## [0.2.0] - 2026-04-25

### Changed (breaking)

- npm package name is now **`retm-library`** (was `emailcraft`). Update all `import` / `require` specifiers and `npm install` commands.
- Root CSS wrapper class is now **`.retm-library-root`** (was `.emailcraft-root`). Update any host CSS that targeted the old class.
- Default `localStorage` key for templates is now **`retm-library:templates:v1`** (was `emailcraft:templates:v1`). Existing stored data under the old key is not migrated automatically.
- Product specification file renamed to **`retm-library-spec.md`** (was `EmailCraft_Spec.md`).

## [0.1.0] - 2026-04-25

### Added

- Initial public baseline for RETM Library panel/viewer library.
- Release workflow scaffolding with Changesets configuration.
- Expanded export and editor/store test coverage from Phase 3 hardening.
