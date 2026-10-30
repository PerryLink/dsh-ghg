import { readFileSync } from 'node:fs'
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const response = await fetch(`https://registry.npmjs.org/${pkg.name.replace('/', '%2f')}`, { headers: { 'user-agent': 'dsh-policy-ledger-prepublish', 'cache-control': 'no-cache' }, signal: AbortSignal.timeout(15000) })
if (response.status === 404) { console.log(`npm version free: ${pkg.name}@${pkg.version}`); process.exit(0) }
if (response.status === 200) { const meta = await response.json(); if (!meta.versions?.[pkg.version]) { console.log(`npm version free: ${pkg.name}@${pkg.version} (package exists)`); process.exit(0) } console.error(`already published: ${pkg.name}@${pkg.version}`); process.exit(1) }
console.error(`name check failed: HTTP ${response.status}`); process.exit(1)
