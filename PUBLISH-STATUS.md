# PUBLISH-STATUS — dsh-ghg

## 0.1.0-alpha.0 — submitted 2026-10-31T07:03+08:00

- npm publish exit 0; shasum `595e6cbf5ef6febb3560fe62b27885ad9e14de87`.
- First-package registry placeholder; verify `dist-tags` and exact tarball before announcing.
- No unpublish/deprecate.

### Verified 2026-10-31T07:06+08:00
- `dist-tags`: latest/next `0.1.0-alpha.0`.
- Registry tarball install into a temp DSH profile passed; layer contains `dsh-ghg`.

## 0.1.0-alpha.1 — partial ESRS E1 (2026-10-31)

- Added `ghg_export_esrs`: Scope 2 only, Scope 1/3 = 0/not in boundary, `data_quality=partial`.
- Tests 3/3; gate 4 S1 rows unchanged.

### latest moved
- `latest`/`next` verified alpha.1 after propagation.

## 0.1.0-alpha.2 — versioned factors (2026-10-31)

- Added `ghg_factor_import`; `ghg_calculate` accepts `factor_id`; 5 gate rows.

## 0.1.0-alpha.3 — partial ESRS pack (2026-10-31)

- Added `ghg_export_esrs_pack` 4-sheet partial ESRS E1 workbook; 6 gate rows.

## 0.1.0-alpha.4 — text PDF ingest (2026-10-31)

- Added `ghg_ingest_pdf` with pdfjs-dist; synthetic PDF test; 7 gate rows.
- PDF path is text-based only; no OCR/scanned PDF.

## 0.1.0-alpha.5 — Scope 1/3 import (2026-10-31)

- Added `ghg_scope_import` for public/synthetic Scope 1/3 values in ESRS pack; 8 gate rows; still partial.
