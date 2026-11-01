# Changelog

## [0.1.0-alpha.14] — 2026-11-01

### Added

- `ghg.scope3_summary`: aggregate Scope 3 rows across the 15 GHG Protocol Corporate Value Chain categories, with category-range and negative-value diagnostics. Verified by `node --test test/*.test.mjs` (13/13).

## [Unreleased]

### Added

- `ghg.period_coverage`: reporting-year completeness check — covered and missing months, row count, kWh and calculated tCO2e. Implemented from the GHG Protocol Scope 2 guidance and the ESRS E1 completeness expectation; no third-party code or fixtures. Verified by `node --test test/ghg.test.mjs` (9/9 pass).

## [0.1.0-alpha.12] — 2026-11-01

### Changed

- Documentation: five-language fixture/acceptance links now resolve on npm; added specific related-checker/tool links.
- Marketplace metadata: taxonomy category, archetype, domains and status; docs page now shows the same.

All notable changes to `dsh-ghg` are documented here. The format follows Keep a Changelog; this project uses alpha versions.

## [0.1.0-alpha.11] — 2026-11-01

### Added

- Five-language READMEs: English, 简体中文, Español, Português, हिन्दी.
- Local workflow SVG at `docs/assets/dsh-ghg-flow.svg`.
- Family cross-links (domain index, checker family, `dsh-kit`), compatibility, permissions, and related-work sections.
- Standard repository files: `SECURITY.md`, `PRIVACY.md`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, and `icon.svg`.

### Changed

- README aligned with the PerryLink DSH checker/plugin family style; package remains public/synthetic, alpha, not GA.

### Maintenance

- 2026-11-01: active again — feature work, hardening and fresh evidence resumed.

## [Earlier]

Earlier alpha builds are available from npm and GitHub Releases; this file starts at the family-standard documentation wave.
