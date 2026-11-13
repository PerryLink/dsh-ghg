# BUILD-LOG — dsh-ghg

## 2026-10-31 — S1 / 0.1.0-alpha.0
- User-approved public/synthetic; 0 firms/0 specialists.
- 6 tools; `ghg` domain (facilities/activities/lines); 3-sheet xlsx.
- `pnpm test` 2/2; gate 4 rows: rows 30/30, MWh 1/1, diff 0, sheets 3/3.
- Name audit: scoped/bare 404; no bin.
- Publish pending.

### Publish submitted
- `npm publish --tag next` exit 0; shasum `595e6cbf5ef6febb3560fe62b27885ad9e14de87`; registry propagation pending.

### Verified
- dist-tags latest/next alpha.0; registry tarball install/layer passed.

### alpha.1 — partial ESRS E1 export

- Added `ghg_export_esrs`; Scope 2 only, data_quality partial; tests 3/3.

### alpha.2 — versioned factors

- Added `ghg_factor_import`; calculate factor_id; tests 5/5; gate 5 rows.

### alpha.3 — ESRS pack

- Added 4-sheet partial ESRS E1 pack; tests 6/6; gate 6 rows.

### alpha.4 — PDF ingest

- Added text-based PDF ingest; tests 7/7; gate 7 rows.

### alpha.5 — Scope 1/3 import

- Added scope import; 8 gate rows; still partial.
