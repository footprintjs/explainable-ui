# Dependency audit evidence

This maintenance tool collects the installed dependency graph's actual npm audit
reports. It does not install packages, fix findings, waive advisories, or change
functional gates. Invoke it through `npm run audit:evidence` immediately after the
normal installation so `npm_execpath` identifies that job's pinned npm CLI.

`collect.mjs` is the entry point. `evidence.mjs` owns fixed-file persistence and
serial full/production collection; `npm-process.mjs` owns a shell-free child with
a two-minute deadline and a combined 16 MiB output ceiling; `audit-report.mjs`
admits npm's version-2 shape and checks counts against package entries and exit
status. Both commands disable scripts and use `--audit-level=info`. Explicit CLI include
lists retain normal prod/optional/peer coverage; full also includes dev, while
production omits dev. These higher-priority lists defeat project/user npm scope
settings. Only inherited child scope variables (NODE_ENV and case-insensitive
npm_config_omit/include/production/only) are removed, without mutating the caller
or logging its environment. HOME and authentication/config access are preserved
for the authorized audit. No advisory, package or severity is exempted.

The fixed `dependency-security/` directory must not already exist. Its files are
exclusive, private writes: the exact generated `package-lock.json`, raw stdout
and stderr, parsed JSON when possible, actual process status, and `report.json`.
The lock's bytes must stay unchanged during both commands. Existing directories
and output symlinks are refused rather than overwritten. No data is executed or
rendered as HTML. The bounded diagnostic summary contains package names, numeric
advisory IDs and installed paths; the complete advisory data remains in raw JSON.

**Collection success is not an audit pass.** A valid npm exit 1 with findings
remains `FINDINGS_UNRESOLVED`, `clean: false`, with that exit 1 saved. The collector
exits zero only when both reports were captured and validated, including when
findings remain unresolved; it prints an explicit warning in that case. This is
a diagnostic collection step, not a replacement for any required security gate.
Spawn, signal, timeout, output-limit, JSON/protocol, lock identity and IO failures
make collection fail with a nonzero collector exit. Unknown cleanliness is never
reported as clean. Future npm audit shape changes require an explicit update.

Run the adjacent offline tests with `node --test scripts/dependency-audit/*.test.mjs`.
They use injected child results, temporary lockfiles, and local Node subprocesses;
they never invoke npm audit or contact a registry.

## Toolchain update boundary

Keep the existing Node 20/22 support. The tsup 8 override to exact esbuild 0.28.2
is outside tsup's declared 0.27 range: acceptance requires the actual normal
builder, CommonJS/ESM/declaration and installed-package gates, not an assumption
of compatibility. jsdom's Undici `^7.30.2` override stays in its parent's 7.x
range. Higher majors such as tsup 9 and Vitest 5 are outside this maintenance work.

Picomatch 4.0.7 remains unpatched for
[GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf).
The repository's static build patterns mitigate its current exposure; that is
neither an audit waiver nor a zero-vulnerability claim. Preserve the actual CI
finding, package paths and advisory identity until an upstream fix is available.
