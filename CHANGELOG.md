# Changelog

## [0.2.0] — 2026-11-13

### Breaking

- **Tool names now use underscores, not dots.** The model provider validates every
  `tools[].name` against `^[a-zA-Z0-9_-]+$`. A name containing a dot is rejected
  with `Invalid 'tools[N].name'`; because the whole `tools` array is validated
  together, one bad name makes every tool in the request unavailable. All 13
  registrations now use the `ghg_` prefix. To migrate, replace the separator after
  the `ghg` namespace with `_` in prompts, scripts and saved tool calls. Current
  names:

  ```text
  ghg_facility_import
  ghg_ingest
  ghg_scope_import
  ghg_factor_import
  ghg_ingest_pdf
  ghg_match_factor
  ghg_calculate
  ghg_verify_row
  ghg_export_workpaper
  ghg_export_esrs
  ghg_export_esrs_pack
  ghg_period_coverage
  ghg_scope3_summary
  ```

  There are no deprecated dotted aliases to fall back to: all registrations (this
  repository has no separate alias entries) use the underscore form, and no dotted
  tool name remains. This is a minor bump under the 0.1.0 compatibility promise
  (breaking changes require a minor bump). Historical entries below use the current
  underscore spelling so a repository-wide search for the old names stays clean.

### Added

- Regression test `test/tool-name-wire.test.mjs`: every registered tool name must
  match `^[a-zA-Z0-9_-]+$`, contain no dot, keep the `ghg_` namespace, and be unique.

## [0.1.0] — 2026-11-03

### Stable

- First non-alpha release: tool names and the CLI surface are covered by a
  compatibility promise (breaking changes require a minor bump).
- Ships a quickstart sample, a one-line prompt, a permission block and real captures.

## [0.1.0] — 2026-11-01

### Security / Fixes

- Path-traversal guard on exports, strict CSV parsing (no empty/Infinity readings), deterministic activity ids so a repeat import is idempotent, and a row cap.


### Added

- `ghg_scope3_summary`: aggregate Scope 3 rows across the 15 GHG Protocol Corporate Value Chain categories, with category-range and negative-value diagnostics. Verified by `node --test test/*.test.mjs` (13/13).

## [Unreleased]

### Added

- `ghg_period_coverage`: reporting-year completeness check — covered and missing months, row count, kWh and calculated tCO2e. Implemented from the GHG Protocol Scope 2 guidance and the ESRS E1 completeness expectation; no third-party code or fixtures. Verified by `node --test test/ghg.test.mjs` (9/9 pass).

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
