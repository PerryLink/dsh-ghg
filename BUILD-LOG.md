# BUILD-LOG — @perrylink/dsh-ghg

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

- Added `ghg.export_esrs`; Scope 2 only, data_quality partial; tests 3/3.
