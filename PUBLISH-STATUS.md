# PUBLISH-STATUS — @perrylink/dsh-ghg

## 0.1.0-alpha.0 — submitted 2026-10-31T07:03+08:00

- npm publish exit 0; shasum `595e6cbf5ef6febb3560fe62b27885ad9e14de87`.
- First-package registry placeholder; verify `dist-tags` and exact tarball before announcing.
- No unpublish/deprecate.

### Verified 2026-10-31T07:06+08:00
- `dist-tags`: latest/next `0.1.0-alpha.0`.
- Registry tarball install into a temp DSH profile passed; layer contains `dsh-ghg`.

## 0.1.0-alpha.1 — partial ESRS E1 (2026-10-31)

- Added `ghg.export_esrs`: Scope 2 only, Scope 1/3 = 0/not in boundary, `data_quality=partial`.
- Tests 3/3; gate 4 S1 rows unchanged.

### latest moved
- `latest`/`next` verified alpha.1 after propagation.

## 0.1.0-alpha.2 — versioned factors (2026-10-31)

- Added `ghg.factor_import`; `ghg.calculate` accepts `factor_id`; 5 gate rows.
