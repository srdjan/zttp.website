# Homepage Simplification Plan

## Delivery

- [x] Reduce the navigation to Proof, Docs, GitHub, and Install.
- [x] Rewrite the hero around pre-disk proof and one primary action.
- [x] Show recorded analyzer output as the main product demonstration.
- [x] Merge the boundary and agent sections into one four-step write path.
- [x] Reduce evidence and runtime content to one compact section.
- [x] Move technical depth into native disclosures and repository docs.
- [x] Reduce installation to one command and the first CLI workflow.
- [x] Remove selectors that no longer match homepage markup.
- [x] Verify formatting, TypeScript checks, progressive enhancement, and
      responsive browser layouts.

## Guardrails

- Keep the existing Deno server, CSP, routes, and cache behavior.
- Keep the proof section static, so the page works without JavaScript.
- Keep product claims aligned with the zttp repository.
- Keep the homepage free of framework code and new client-side dependencies.

## Verification

```sh
deno fmt --check
deno check main.ts static/script.js
deno task test
deno task start
```

Review the homepage at desktop and mobile widths with JavaScript enabled and
disabled. Exercise the proof section, copy controls, mobile menu, disclosures,
and anchor links.

## Development Content Update: 2026-11-04

The user approved five grouped disclosures on the existing homepage. The release
labels and downloads stay at v0.26.0. Development changes remain unreleased.

The source range includes `617243e376beefc439fca4b229a86fe8d2a0b2ba` through
`e5073153d2498a900301f8e22df2b56a831fc133`. The website baseline is
`ceff2737d933075448068827ad2286a7e1fd3989`. Both checkouts started clean on
local `main`.

### Content audit

Source paths below refer to the sibling ZTTP checkout at the reviewed revision.
Every destination is an unreleased disclosure in `static/index.html`.

| Change group                                   | Source                                                                                 | Destination and evidence limit                                                          |
| ---------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Module certificates and typed file imports     | `docs/verification.md#handlers-with-file-imports`, `packages/tools/src/precompile.zig` | File imports: producer coverage remains trusted; dependency digests bind bytes          |
| Check and build parity                         | `packages/tools/src/precompile_graph_check.zig`                                        | File imports: retain the build-only `GraphResultsNotProved` exception                   |
| Function values and predicates                 | `packages/zts/src/type_checker.zig`, `docs/typescript.md`                              | Type checks: describe supported predicate forms, not complete TypeScript support        |
| Arithmetic and builtin results                 | `packages/zts/src/builtin_results.zig`, `docs/typescript.md`                           | Type checks: result typing depends on argument types                                    |
| Callbacks, Results, and schema failures        | `packages/zts/src/module_result_errors.zig`, `docs/typescript.md`                      | Type checks: a successful Result can still hold `undefined`                             |
| Members and typed Dict operations              | `packages/zts/src/type_checker.zig`, `docs/typescript.md`                              | Type checks: unknown Dict keys retain a JSON checking gap                               |
| Wide arrays, unions, spreads, and writes       | `packages/zts/src/pipeline_tests.zig`, `packages/zts/src/type_checker.zig`             | Containers: retain unresolved-value gaps; explicit literal annotations stay restrictive |
| Artifact compatibility and admission           | `CHANGELOG.md`, `packages/runtime/src/self_extract.zig`                                | Upgrade: rebuild artifacts; existing self-extracting binaries keep running              |
| Response contracts and compatibility           | `packages/zts/src/contract_diff.zig`, `CHANGELOG.md`                                   | Upgrade: read `responses`; changed responses can stop a hot swap                        |
| Removed CLI and installer compatibility        | `CHANGELOG.md`, `install.sh`                                                           | Upgrade: name replacements and link the complete migration record                       |
| Development recording and coverage             | `docs/convergence.json`, `docs/coverage.json`                                          | Evidence: name recording provenance; do not describe later code as measured             |
| Optional runtime cost fuse                     | `docs/verification.md#cost-envelope-multiplicity`                                      | Evidence: shipped commands do not configure `cost_ceilings`                             |
| Internal moves, dead code, and test migrations | `docs/plans/2026-10-30-reset-worklog.md`                                               | Upgrade: one maintenance summary, without performance claims                            |

### Execution and acceptance

I will record this audit before editing the homepage. The turn budget is three
turns. Acceptance requires a source, destination, and limit for each change
group.

I will replace the long development disclosure with five native disclosures. The
turn budget is four turns. Acceptance requires accurate claims and an updated
sitemap date.

I will check the page with the existing tests and desktop and mobile browsers.
The turn budget is three turns. Acceptance requires keyboard access and readable
content without JavaScript.

The existing server and markup tests cover the unchanged behavior. This content
update needs no test that duplicates its prose. Browser checks cover the new
disclosure structure.

`deno task verify` is the canonical gate before each commit. Browser checks also
cover links, wrapping, navigation, and installation. Every new source link must
resolve to a file and heading at the reviewed revision.

Progress and results belong in `docs/evolution-log.md`. Each complete unit gets
a local commit. The user owns publication. No push or deployment is authorized.
