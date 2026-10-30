---
title: Stable Site Reset - Plan
type: refactor
date: 2026-10-30
artifact_contract: ce-unified-plan/v1
product_contract_source: ce-plan-bootstrap
execution: code
---

# Stable Site Reset - Plan

## Goal Capsule

**Objective:** Future contributors can change this site with clear ownership,
reliable checks, and evidence that visitors retain the current experience.

**Means:** Keep the static architecture and close its verification and
documentation gaps. The decisions below define the boundaries of the reset.

**Plan authority:**
`docs/plans/2026-10-30-0750-refactor-stable-site-reset-plan.md` is the sole
authority for this reset. The findings review, decisions, phase scope, and
acceptance checks live in this document. Older plans provide historical
evidence; their unfinished tasks do not extend this reset. `CLAUDE.md` remains
the authority for general project conventions. The current user request takes
precedence over both documents.

**Planning boundary:** This request authorizes this document only. The phases
describe future work; this planning session does not execute them.

**Execution profile:** Each phase produces one isolated local commit on `main`,
after its checks pass. The implementer owns the edits, checks, and cleanup. The
user owns pushing and deployment. No phase requires a branch, a pull request, or
a deployment.

**Stop conditions:** A phase stops when evidence requires different visitor
behavior, a new production dependency, or broader architecture. The implementer
reports the conflict in this document before changing scope. Existing user work
remains outside the reset.

---

## Product Contract

### Summary

The reset retains the Deno server, static documents, shared stylesheet, and
browser script. It establishes behavior coverage, checks the shipped JavaScript,
removes confirmed unused CSS, and reconciles documentation.

### Problem Frame

The production architecture already matches the site's small scope. The
remaining uncertainty comes from incomplete verification and instructions that
describe removed features. Contributors can follow obsolete plans or change
browser behavior without a useful failure from the current checks. A rewrite
would increase the number of changes without resolving these problems more
directly.

### Requirements

R1 (preserve visitor behavior). The reset preserves content, navigation,
installation, disclosures, responsive layouts, keyboard access, and
reduced-motion support. The proof remains recorded HTML with its source
attribution.

R2 (preserve HTTP behavior). The reset preserves routes, redirects, response
headers, validators, cache policies, asset URLs, and the dedicated recovery
page. Observed HTTP defects remain explicit exclusions unless a later request
authorizes their correction.

R3 (preserve operation). The reset preserves local development, release-version
synchronization, the verification command, CI, and verification before
deployment. The version remains `0.26.0` throughout this reset.

R4 (make checks effective). Verification checks the shipped JavaScript and
exercises the public contracts that the reset relies on. The checks use the
existing test dependency and simple doubles.

R5 (limit change). Every edit supports a finding in this document. The reset
adds no framework, build step, backend, live analyzer, or new production
dependency.

R6 (align documentation). Current guidance describes the final design and points
to this reset authority. Historical documents retain their context and cannot
appear to authorize removed features.

R7 (review small phases). Each phase names its files, dependencies, tests,
acceptance criteria, and exact verification. Each phase leaves the site usable
and the completed checks passing.

### Preservation Inventory

This inventory defines the compatibility surface for R1 through R3. The
implementer captures the browser baseline before editing frontend files.

| Surface          | Required behavior                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| Home             | `/` serves the current page with its five sections and footer links.                                           |
| Redirects        | `/index.html`, `/deck`, and `/deck.html` return 301 with `Location: /`.                                        |
| Recovery         | Unknown paths return the separate recovery document with status 404 and `noindex`.                             |
| Static files     | Referenced icons, images, CSS, JavaScript, manifest, robots, and sitemap remain available.                     |
| Cache            | HTML, text, XML, and the manifest revalidate; other assets retain immutable caching.                           |
| Validators       | An exact ETag match returns an empty 304 with the applicable headers.                                          |
| No JavaScript    | Content, anchor links, native disclosures, installation text, and mobile navigation remain usable.             |
| Menu             | The button toggles the menu; a link, Escape, or an outside click closes it.                                    |
| Copy             | Both cards copy the same normalized command, show feedback, and retain the prompt fallback.                    |
| Scroll indicator | The first linked section in the observation band wins; the indicator clears outside that band.                 |
| Version          | Configuration, navigation, release URL, and download label agree through `sync-version`.                       |
| Presentation     | Fonts, palette, motions, focus indicators, breakpoints, and the recovery layout retain their current behavior. |

The validator rule also applies to the current recovery response. An unknown
path with the recovery document's matching ETag currently returns 304. This
records compatibility behavior; it does not declare that behavior correct HTTP
semantics.

### Scope Boundaries

The reset does not change product positioning, evidence grades, proof output,
release claims, installation commands, or linked upstream documentation. It does
not re-record compiler output or revalidate the upstream compiler's claims.

A server module split, asset pipeline, generated HTML, template system, router,
CSS framework, and replacement DOM library are excluded. The current boundaries
do not require these mechanisms.

Automatic cache hashing, automatic release publication, a browser test platform,
and performance targets are excluded. The reset preserves the existing manual
cache revisions and local browser checks. No measured performance problem
justifies additional machinery.

The reset does not repair MIME mappings, conditional 404 semantics, HTTP method
handling, or the missing-recovery-file response. Those observed behaviors need
separate compatibility decisions and focused work.

---

## Findings Review

### Review Baseline and Limits

The review targets commit `3712b1a78c62b62f784d70ab45bc29743cf83298` on
2026-10-30. The working tree was clean before planning. The repository contains
53 tracked files, including 16 static files.

The review covered the production server, browser script, release helper, both
test files, configuration, workflow, markup, CSS, and project documentation. It
also checked the pending type-check plans and the completed removal of the
playground. Source inspection found 14 test declarations: ten site contracts and
four scroll-indicator tests. The current verification gate subsequently passed
all 14 tests. Every reported individual test completed in under one second.

The local runtime reports Deno `2.9.8` and TypeScript `6.0.3`. CLI help confirms
the installed `--frozen-lockfile` option. The review did not start a server or
browser. The direct frozen type check of `tests/script_behavior_test.ts` also
passed. Neither check changed tracked files. The implementation phases must
establish results for their proposed changes and collect browser evidence.

### Finding 1: The Current Architecture Is Already Appropriate

**Evidence:** `main.ts` contains 142 lines and exports `handleRequest`.
`static/script.js` contains 111 lines and implements three enhancements.
`CLAUDE.md` explicitly keeps the server in one file and requires usable HTML
without JavaScript.

**Effect:** Separating these files into application layers would add boundaries
without removing an existing responsibility conflict. The site has no database,
API, domain service, or production package graph to untangle.

**Disposition:** Retain the production file boundaries. The later phases
strengthen their public contracts instead of replacing their architecture.

### Finding 2: Verification Does Not Check Shipped JavaScript

**Evidence:** `deno.json:10` checks the server, release helper, and one test
entry point. `deno.json:16` enables strict TypeScript but does not enable
`checkJs`. `static/script.js` has no checking pragma. `docs/plan.md` still lists
a JavaScript check that does not establish JavaScript correctness under this
configuration.

**Condition and effect:** A browser-script type error can ship while the
explicit type-check stage succeeds. The script uses untyped parameters, nullable
selections, event targets, datasets, and observer collections.

**Disposition:** Phase 4 adds JSDoc types, proper narrowing, browser libraries,
and an effective check in `deno task verify`. The phase measures current
diagnostics instead of reusing counts from old plans.

### Finding 3: Browser Tests Cover Only the Scroll Indicator

**Evidence:** `tests/script_behavior_test.ts:29` boots the actual script against
the parsed homepage. Its four tests cover observation options, activation,
clearing, and ordering. No test drives the menu or copy buttons.

**Condition and effect:** A menu or clipboard regression can pass the current
suite. The suite also lacks tests for an absent observer and an observer
constructor that throws.

**Disposition:** Phase 3 extends the existing behavior harness before Phase 4
changes the script. The harness remains test-only. `deno task test` already
type-checks the test files; the omission from the explicit check command does
not make those tests unchecked.

### Finding 4: The Release Helper Has No Direct Behavior Tests

**Evidence:** `scripts/sync_version.ts:36` exports the pure `applyVersion`
function. The function validates input and requires exactly one match for each
version target before returning rewritten text.
`tests/site_contract_test.ts:209` checks only agreement among the current four
copies.

**Condition and effect:** A faulty rewrite can escape detection until someone
runs the release helper. The agreement test does not prove rejection of missing
targets, duplicate targets, or invalid input.

**Disposition:** Phase 5 tests `applyVersion` through its exported API with
in-memory file contents. The helper's implementation and accepted input syntax
remain unchanged.

### Finding 5: The Import Range and Lockfile Disagree

**Evidence:** `deno.json:14` requests `@b-fuze/deno-dom@^0.1.56`. `deno.lock:4`
and its workspace dependencies record `@b-fuze/deno-dom@~0.1.56`, resolved to
`0.1.56`.

**Condition and effect:** The configuration and lockfile use different
serialized ranges for the same dependency. The baseline gate and a direct frozen
type check both passed without a lockfile change. The review therefore
establishes an inconsistency, not a current dependency failure. The existing
nested verification commands do not explicitly require frozen dependency
resolution.

**Disposition:** Phase 1 restores the recorded `~0.1.56` range and retains
resolution `0.1.56`. The phase makes dependency checks frozen so verification
cannot silently rewrite the lockfile. No dependency upgrade belongs in the
reset.

### Finding 6: HTTP Contracts Have Useful Coverage Gaps

**Evidence:** `tests/site_contract_test.ts` covers a normal recovery response,
deck redirects, homepage revalidation, and selected CSP conditions. It does not
cover `/index.html`, every cache category, full security headers, query-bearing
asset URLs, or referenced-asset availability. The image test checks that files
have references; it does not prove that every reference has a file.

**Condition and effect:** Routing, asset, or header changes can break a
preserved contract without a failing test.

**Disposition:** Phase 2 expands tests at `handleRequest`, without changing the
server or exposing its private helpers. It also checks document references
through parsed markup.

### Finding 7: CSS Cleanup Has a Small Confirmed Scope

**Evidence:** A literal scan across both HTML documents and the browser script
finds no use of `.z-token-key` or `.z-token-str`. Their rules appear at
`static/style.css:561` and `static/style.css:566`. The declarations
`--z-bg-soft`, `--z-accent-soft`, and `--z-blue` each occur once in the
stylesheet.

**Condition and effect:** These unused names add maintenance noise after the
removal of earlier UI. The scan provides no evidence that the rest of the
stylesheet is unused.

**Disposition:** Phase 6 removes only these candidates after confirming selector
and token references. It preserves the paired live selectors `.z-cmd` and
`.z-str`. It does not reorder the cascade or merge reduced-motion blocks.

### Finding 8: Documentation Can Direct Work Toward Removed Features

**Evidence:** `plans/README.md` lists plans 014, 015, and 016 as TODO. Plan 015
targets the deleted `static/playground.js`. The index omits completed plan 019,
which records the replacement with static proof output. `docs/plan.md` describes
a completed homepage change rather than this reset.

`docs/solutions/ui-bugs/fail-closed-progressive-enhancement.md` describes
deleted playground, deck, and stylesheet files as current implementation
evidence. The latest entry in `docs/evolution-log.md` says the release remains
`0.24.0`; the current site declares `0.26.0`.

**Condition and effect:** An executor can revive obsolete work or infer that
removed files still require maintenance.

**Disposition:** Phase 7 reconciles the index and current guidance. Historical
evidence remains clearly dated and labeled. The existing `AGENTS.md` pointer
remains the only agent-guidance entry point beside `CLAUDE.md`.

### Finding 9: Asset Revisions Remain a Shared HTML Contract

**Evidence:** Both HTML documents reference `/style.css?v=31`. The homepage
references `/script.js?v=18`. `main.ts:104` gives these assets immutable
caching, and `CLAUDE.md` requires revision changes when their contents change.

**Condition and effect:** A CSS or JavaScript edit without a matching revision
can leave returning visitors with older content.

**Disposition:** Phase 2 tests agreement of stylesheet URLs. Phases 4 and 6
change the relevant revisions in the same commit as the asset. The reset adds no
new revision mechanism.

### Finding 10: Existing HTTP Details Must Not Change Accidentally

**Evidence:** `main.ts:23` maps `.jpg`, but not the shipped `.jpeg` logo, to
`image/jpeg`. The logo therefore receives `application/octet-stream` under the
current mapping. `main.ts:133` can return 304 for an unknown path when the
recovery ETag matches. `main.ts:123` returns a bare 404 when the recovery file
cannot be read.

The handler does not branch on request method. `readAsset` returns `null` for
every file-read exception. These are observations from source, not measured
browser or deployment failures.

**Disposition:** Preserve these behaviors during the reset. Phase 2
characterizes the reachable validator and MIME cases without presenting them as
desired protocol design. No filesystem adapter or fault-injection architecture
will be added to test the missing-file fallback.

### Finding 11: Static Fallback and Evidence Are Existing Product Choices

**Evidence:** `static/index.html` contains recorded output attributed to zttp
`0.22` at commit `20caa237`. The site version is `0.26.0`; these identifiers
describe different things. `static/script.js:1` changes the root marker only
after the external controller loads. Native disclosures and installation text
work independently of that controller.

**Condition and effect:** A reset that treats the old recording as a stale
version could change factual evidence without a new recording. A reset that
moves content into JavaScript would remove the fallback.

**Disposition:** Preserve the recording, attribution, section IDs, installation
text, and native disclosures. The browser baseline records existing limitations,
including visible copy buttons that do not act without JavaScript. The reset
does not add enhancement states or redesign these controls.

---

## Planning Contract

### First-Principles Reasoning

A marketing site must deliver truthful content, navigation, and an installation
path. Static HTML supplies these functions without an application runtime in the
browser. The server owns HTTP behavior; CSS owns presentation; JavaScript owns
optional interaction. Tests should observe these boundaries rather than require
new production abstractions.

The most useful reset removes uncertainty at these boundaries. More files,
generated content, or a new framework would not establish the missing evidence.
The reset therefore keeps production architecture stable and improves the checks
around it.

### Key Technical Decisions

The decisions are technical recommendations within the requested reset scope. No
decision authorizes execution in this planning session.

| Decision                          | Options                                                                         | Selected recommendation                             | Reason                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------- |
| Decision 1: production boundaries | Retain static files; split server modules; introduce a framework.               | Retain static files.                                | Current responsibilities are small and explicit.                        |
| Decision 2: JavaScript checking   | JSDoc and `checkJs`; browser TypeScript compilation; replace the script.        | JSDoc and `checkJs`.                                | Checking requires no browser build step.                                |
| Decision 3: verification          | Extend existing tests; replace the harness; install browser infrastructure.     | Extend existing tests and use local browser checks. | Existing boundaries support the required behavior checks.               |
| Decision 4: dependency baseline   | Restore recorded range; upgrade the DOM library; replace the DOM library.       | Restore `~0.1.56`, retaining `0.1.56`.              | The reset does not require a dependency change.                         |
| Decision 5: duplication           | Preserve explicit HTML; generate shared markup; add templates.                  | Preserve explicit HTML.                             | Tests can protect the few shared values without a rendering system.     |
| Decision 6: CSS organization      | Remove proven unused names; reorder all rules; split stylesheets.               | Remove proven unused names.                         | A broader cascade change has no demonstrated benefit here.              |
| Decision 7: history               | Reconcile historical status; delete old documents; keep competing active plans. | Reconcile historical status.                        | Contributors need one current direction without losing prior decisions. |

### Final Design and Ownership

`main.ts` continues to own request handling, security headers, validators, cache
decisions, and server startup. Its exported `handleRequest` remains the server
test boundary.

`static/index.html` owns all product content and proof evidence.
`static/404.html` owns recovery content. Both documents share `static/style.css`
and its revision.

`static/script.js` stays directly executable JavaScript. Small local functions
and JSDoc explain its existing menu, copy, and observer responsibilities. It
gains no exports, module loader, global testing API, or dependency.

`scripts/sync_version.ts` remains the only version writer. Its existing
`applyVersion` export supports tests without filesystem writes or the sibling
compiler repository.

`deno task verify` remains the single gate for local work, CI, and deployment.
Its dependency-consuming commands use frozen lockfiles. It explicitly checks the
shipped script and discovers the current TypeScript test files.

### Assumptions and Deferred Measurements

The plan treats the checked-in experience as the preservation baseline,
including the limitations identified above. This interpretation follows the
user's functionality-preservation requirement; the user has not approved
unrelated behavior corrections.

The current JavaScript diagnostic count and browser geometry need measurement.
Test timings and dependency outcomes after the proposed changes also need
measurement. The Review Baseline and Limits section records the completed
baseline checks. Phase limits below are work limits, not estimates of runtime or
performance improvement. The local Deno version identifies this review
environment; the reset does not pin a new runtime or change CI's version policy.

### Phase Order and Change Control

Phase 1 establishes reproducible dependency resolution. Phases 2, 3, and 5 then
protect independent server, interaction, and release contracts. Phase 4 waits
for Phase 2's browser baseline and Phase 3's behavior tests before changing
browser source. Phase 6 waits for Phase 2's browser baseline. Phase 7 reconciles
documentation after all earlier phases.

The recommended review order is 1, 2, 3, 4, 5, 6, 7. Each phase receives a
budget of six implementation turns. At that limit, the implementer hands back
changed files, completed checks, and open items. The implementer does not
enlarge a phase to consume unrelated work.

---

## Implementation Units

### U1. Phase 1: Make Dependency Verification Reproducible

**Goal:** Checks use the existing locked dependency without rewriting dependency
state. **Requirements:** R3 (preserve operation), R4 (make checks effective),
and R7 (review small phases). **Files:** `deno.json`, `deno.lock` only if
regeneration changes its metadata. **Dependencies:** None.

**Approach:** Restore the import range recorded in the lockfile. Keep the
resolved package version and integrity unchanged. Add `--frozen-lockfile` to the
`deno test` task and the `deno check` command inside `verify`. Keep `start`,
`dev`, `sync-version`, and `deploy` behavior unchanged.

**Test expectation:** No new unit test; the frozen dependency checks exercise
the configuration directly. First run the focused behavior file as the small
pipeline check. If dependency resolution fails, separate network failure from
lockfile mismatch before changing configuration again.

**Exact verification:**

```sh
deno test --frozen-lockfile --allow-read tests/script_behavior_test.ts
deno task verify
git diff --check
git diff -- deno.json deno.lock
```

**Acceptance:** Both test commands succeed without an upgrade or
verification-time lockfile rewrite. The configuration diff contains only the
range alignment and frozen flags. The phase records test durations; each
individual test must finish in under one second.

### U2. Phase 2: Protect HTTP and Document Contracts

**Goal:** Tests identify changes to the preserved request and markup contracts.
**Requirements:** R1 (preserve visitor behavior), R2 (preserve HTTP behavior),
and R4 (make checks effective). **Files:** `tests/site_contract_test.ts`.
**Dependencies:** Phase 1.

**Approach:** Extend the tests through `handleRequest` and parsed documents.
Keep source-text assertions only where literal content is the actual contract.
Replace fragile role and link regex checks with DOM queries where that improves
semantic coverage. Retain existing tests for removed product features and
version agreement.

**Test scenarios:** All three redirects have status 301 and location `/`. Home,
robots, sitemap, manifest, CSS, script, images, and direct `/404.html` have
their current status and cache categories. The 404 response includes its
recovery links and `noindex`. Security headers match the current values on
successful files, redirects, conditional responses, and the normal recovery
response.

Matching validators return 304 with no body; stale validators return the
complete current representation. Weak and list validators retain the current
full-response behavior. An unknown URL with the recovery ETag retains its
current conditional response. Query revisions do not change the served asset
bytes.

Each same-origin asset reference in both documents and the manifest resolves to
a successful response. This includes metadata image URLs and structured-data
logo references. The test uses URL pathnames and preserves query strings where
cache revisions matter. Both documents reference the same stylesheet URL. Anchor
targets exist, install groups remain nameable, and the recording retains its
attribution.

The MIME assertions characterize the existing `.jpeg` response without changing
the mapping. Tests do not rename real files or introduce a server filesystem
adapter.

**Exact verification:**

```sh
deno test --frozen-lockfile --allow-read tests/site_contract_test.ts
deno task verify
git diff --check
```

The implementer also performs the browser baseline procedure in the Verification
Contract. The implementer stores screenshots and any recording scripts only in
ignored `demos/`.

**Acceptance:** The expanded tests pass against unchanged production files. The
baseline records observed behavior and any existing visual limitation. No
production defect is silently corrected to make a characterization test pass.

### U3. Phase 3: Protect Optional Interaction Behavior

**Goal:** Tests cover menu, copy, and observer behavior before the script
receives type annotations. **Requirements:** R1 (preserve visitor behavior) and
R4 (make checks effective). **Files:** `tests/script_behavior_test.ts`.
**Dependencies:** Phase 1.

**Approach:** Reuse the parsed homepage and evaluation of the actual shipped
script. Add small doubles for clipboard, prompt, timers, and observer
availability. Capture and await asynchronous event handlers explicitly. Capture
listener registrations separately for each element and the document. The doubles
supply event `target` and `key` values and invoke the registered handlers
directly. They do not assume DOM bubbling or await completion through
`dispatchEvent`. The evaluator receives the DOM constructors that the shipped
script uses. Use timer control rather than real waits for copy feedback. Avoid a
new harness module or generic mock framework.

**Test scenarios:** The menu button toggles `.open` and `aria-expanded`
together. A menu link, Escape, and an outside click close an open menu. An
inside click does not close the menu. Missing menu nodes do not prevent copy
setup.

Each copy button writes the exact normalized install command and shows `Copied`
after success. An absent or rejecting clipboard calls the existing prompt
fallback with that command. The captured reset callback restores the original
button text. Both cards remain independent and usable after repeated clicks.

An absent observer leaves the other enhancements usable. A throwing observer
reports the existing error without preventing menu or copy actions. Existing
tall-section, clearing, and ordering tests remain. The document root changes
from `no-js` to `js` when the script executes.

**Exact verification:**

```sh
deno test --frozen-lockfile --allow-read tests/script_behavior_test.ts
deno task verify
git diff --check
```

**Acceptance:** Tests exercise the real event callbacks and awaited clipboard
outcomes. No production export or test-only browser hook appears. No test waits
for the real feedback timer. The implementer records any DOM-library limitation
rather than replacing production behavior with a test convenience.

### U4. Phase 4: Check the Shipped JavaScript

**Goal:** The single verification command rejects type errors in the script that
visitors execute. **Requirements:** R1 (preserve visitor behavior), R4 (make
checks effective), and R5 (limit change). **Files:** `static/script.js`,
`deno.json`, `static/index.html`, and narrowly scoped environment wiring in
`tests/script_behavior_test.ts`. **Dependencies:** Phases 1, 2, and 3.

**Approach:** Enable `checkJs` and configure `deno.window`, `dom`,
`dom.iterable`, and `esnext` libraries. Keep strict checking enabled. Use JSDoc
for parameters and collections, and narrow nullable elements and event targets
before use. Do not use `any`, suppression comments, or unproved casts to silence
diagnostics. Keep the current controller structure and initialization order
unless a guard needs a local correction.

The explicit check command in `verify` becomes the following command. The
existing format, lint, and test stages remain.

```sh
deno check --frozen-lockfile main.ts scripts/*.ts tests/*.ts static/script.js
```

The script revision in the homepage changes in the same commit. The script URL
remains a direct JavaScript resource. The phase does not change product text,
menu semantics, copy timing, or observer ordering.

**Test scenarios:** All Phase 3 behavior assertions remain unchanged and pass.
If runtime narrowing needs DOM constructors, the evaluator receives those
constructors through its injected environment. Only that environment wiring may
change in the behavior test file during this phase. A temporary incompatible
JSDoc assignment in the shipped script makes `deno task verify` fail during
checking. The implementer removes that temporary assignment before the final
checks. The temporary check proves the gate reaches JavaScript rather than
merely accepting a `.js` argument.

**Exact verification:**

```sh
deno check --frozen-lockfile main.ts scripts/*.ts tests/*.ts static/script.js
deno test --frozen-lockfile --allow-read tests/script_behavior_test.ts
deno task verify
git diff --check
```

The implementer repeats the JavaScript-enabled browser interactions from the
baseline at desktop and mobile widths. The implementer also repeats the
blocked-script fallback check.

**Acceptance:** The deliberate type error fails the gate; the clean script
passes without suppressions. The behavior tests and browser comparison show no
change to the preserved flows. Both test code and server code still check with
the combined libraries.

### U5. Phase 5: Protect Version Rewrites

**Goal:** Release updates have a tested public contract without additional
release machinery. **Requirements:** R3 (preserve operation) and R4 (make checks
effective). **Files:** New `tests/sync_version_test.ts`. **Dependencies:**
Phase 1.

**Approach:** Import `applyVersion` and supply in-memory strings for its two
files. Use the current checked-in documents for one integration-shaped fixture.
Keep small synthetic strings for missing and duplicate targets. The tests do not
run the write command or depend on `../ZTTP/VERSION`.

**Test scenarios:** A normal version updates exactly the four targets. A
prerelease such as `1.2.3-beta.1` remains accepted. Invalid input returns
`ok: false` and leaves the input mapping unchanged. Each missing or duplicated
target returns failure without returning partial output. Unrelated content,
recorded compiler attribution, and asset revisions remain byte-identical after a
successful rewrite. Applying the same version twice is idempotent.

The tests preserve the helper's current syntax contract; they do not introduce a
broader semantic-version policy. The existing agreement test remains a separate
check of the actual site.

**Exact verification:**

```sh
deno test --frozen-lockfile --allow-read tests/sync_version_test.ts
deno task verify
git diff --check
```

**Acceptance:** The tests pass through the exported API without changing the
helper or actual site version. No filesystem write permission is required.

### U6. Phase 6: Remove Confirmed Unused CSS

**Goal:** The stylesheet loses obsolete names without a cascade redesign.
**Requirements:** R1 (preserve visitor behavior) and R5 (limit change).
**Files:** `static/style.css`, `static/index.html`, `static/404.html`.
**Dependencies:** Phase 2.

**Approach:** Confirm Finding 7's candidates against both documents, the script,
and CSS references. Remove the two unused selector names and three unused token
declarations. Keep the live selectors that share each rule. Keep rule order,
specificity, media queries, keyframes, and both reduced-motion blocks unchanged.
Advance the shared CSS revision in both documents together.

**Test expectation:** No new unit tests for deletion-only style changes.
Existing contract tests protect references; browser comparison protects
rendering.

**Exact verification:**

```sh
rg -n 'z-token-key|z-token-str|--z-bg-soft|--z-accent-soft|--z-blue' static
deno task verify
git diff --check
git diff -- static/style.css static/index.html static/404.html
```

The `rg` command must return no matches and exit 1; the remaining commands must
succeed. The implementer compares the full browser matrix in the Verification
Contract with the baseline.

**Acceptance:** The diff removes only confirmed unused CSS and updates the two
stylesheet URLs. The browser comparison shows no reset-caused layout, motion,
focus, or recovery-page change. Any further cleanup needs additional evidence
and separate scope review.

### U7. Phase 7: Reconcile Documentation and Retire Competing Instructions

**Goal:** Current documentation describes the completed design and preserves
historical context. **Requirements:** R6 (align documentation) and R7 (review
small phases). **Files:** `CLAUDE.md`, `docs/plan.md`, `docs/design.md`,
`docs/evolution-log.md`, and `plans/README.md`. Additional scoped files are
`plans/014-typecheck-script-js.md`, `plans/015-typecheck-playground-js.md`, and
`plans/016-check-javascript-by-default.md`. The historical solution file is
`docs/solutions/ui-bugs/fail-closed-progressive-enhancement.md`.

**Dependencies:** All earlier phases.

**Approach:** Document actual checked JavaScript, frozen dependency checks, all
current test files, and unchanged production ownership in `CLAUDE.md`. Correct
its cache description to include `.txt` files, matching the existing server.
Keep `AGENTS.md` as a pointer; do not duplicate canonical guidance.

Mark `docs/plan.md` as completed homepage history and link this reset authority.
Retain `docs/design.md` as the product-design authority and add only verified
design-contract clarifications. If that document already matches the final
design, leave it unchanged. Add a dated reset entry to the evolution log and
identify its older version statements as historical. Do not rewrite historical
evidence as current release claims.

Reconcile the index through plan 019 and link this reset as the current reset
authority. Mark plan 014's checking task as superseded by this reset's delivered
Phase 4. Mark plan 015 obsolete because its target no longer exists. Mark plan
016's checking direction as superseded by Phase 4, without reviving its deleted
targets. Retain the earlier decisions permitting the test-only DOM dependency
and the canonical guidance pointer.

Add a historical-scope notice to the solution document. State that its
playground and deck implementation was removed, while its fallback principle
still applies. Do not reconstruct the deleted files to make old line references
valid.

**Test expectation:** No new tests for documentation. Review each changed
instruction against the actual final command, file, or behavior.

**Exact verification:**

```sh
deno task verify
git diff --check
rg -n 'TODO|playground|deck|checkJs|verify|reset' CLAUDE.md docs/plan.md plans/README.md plans/014-typecheck-script-js.md plans/015-typecheck-playground-js.md plans/016-check-javascript-by-default.md
git diff --stat
```

The search requires manual review; historical names may remain only with
explicit context. The implementer checks the reset link in every changed
document and confirms the target exists.

**Acceptance:** A new contributor finds one reset plan, one convention document,
and an accurate design reference. No active instruction targets a deleted
playground or deck. Documentation claims no verification or release that the
recorded evidence does not establish.

---

## Verification Contract

### Rules for Every Phase

The focused command runs first; the full `deno task verify` gate follows before
each commit. Each phase records command outcomes and test timings in its
implementation handback. The handback distinguishes source review, automated
checks, browser checks, and deployment. No phase claims deployment from a local
check.

The initial focused run has a one-minute limit to validate the full test path at
small scale. A longer run needs diagnosis before further work. If a required
script exceeds two minutes, the implementer stops and follows the repository's
confirmation requirement. These are execution limits, not predictions.

The implementer checks the working tree before each phase. Only the phase's
named files enter its commit. Reverting a phase means reverting its isolated
commit, including matching asset revisions. The implementer never rewrites
history or pushes as part of this reset.

### Browser Baseline and Comparison

The implementer first confirms that port 8000 is free. The implementer starts
the site with `deno task start` and records the process identifier. The
implementer uses a new browser session and preserves sessions opened by the
user.

The baseline captures `/` and `/outside-the-fence` at `320x800`, `760x900`,
`761x900`, `1080x900`, and `1440x1000`. These are test dimensions selected
around the current layout boundaries, not measurements of visitor devices. The
implementer repeats the affected captures after frontend changes.

| Mode               | Exact check                                                                                          | Expected result                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| JavaScript enabled | Open and close the mobile menu through button, link, Escape, outside click, and inside click.        | State and `aria-expanded` agree with the baseline.                            |
| JavaScript enabled | Copy from each install card, including clipboard rejection.                                          | The exact command reaches clipboard or prompt; feedback resets.               |
| JavaScript enabled | Scroll through Proof and Install, then leave the observed sections.                                  | The indicator selects and clears according to the existing band rule.         |
| Script blocked     | Block `/script.js` and reload at mobile and desktop widths.                                          | Navigation, proof, installation text, and disclosures remain usable.          |
| Keyboard           | Use the skip link, navigation, both copy buttons, and every disclosure summary.                      | Focus remains visible; disclosures open and close; no new focus trap appears. |
| Reduced motion     | Enable reduced motion and reload home and recovery pages.                                            | Decorative motion remains suppressed as in the baseline.                      |
| Responsive layout  | Inspect the header, proof cards, commands, disclosures, and recovery actions at every capture width. | No reset-caused overflow, clipping, hidden action, or layout change appears.  |

The implementer compares new console errors with the baseline. Expected
observer-error output in the forced-failure test does not count as an unexpected
browser error. Automated DOM doubles do not establish layout, native focus
behavior, or clipboard permission behavior; the browser checks cover these
limits.

The implementer closes every browser session opened for the checks and stops the
recorded server process. Cleanup must run after a failed check too.

```sh
lsof -nP -iTCP:8000 -sTCP:LISTEN
```

The final command must print no listener and exit 1. If a pre-existing listener
belongs to the user, the implementer does not kill that process. The implementer
reports that conflict before starting a replacement server.

### Final Reset Acceptance

```sh
deno task verify
git diff --check
git status --short
lsof -nP -iTCP:8000 -sTCP:LISTEN
```

The gate must pass with the committed lockfile unchanged. The working tree must
contain no uncommitted reset edits or temporary fault probes. Ignored `demos/`
may contain the recorded browser evidence. Port 8000 must be free and every
browser session opened by the implementer must be closed.

---

## Definition of Done

All seven phases satisfy their own acceptance criteria and the final reset
checks. The production boundaries match the Final Design and Ownership section.
The site retains the Preservation Inventory, and the JavaScript gate
demonstrably rejects a type error. Tests cover the server, menu, copy, observer
failure, and version rewrite contracts through their public boundaries.

Only confirmed unused CSS disappears. Every changed asset has its matching
revision update. Current documentation points to this authority and describes
actual code and checks. Historical material cannot be mistaken for active reset
instructions.

The final diff contains no abandoned implementation, test hook, dependency
experiment, generated demo, or unrelated product change. The implementer
supplies check results and remaining evidence limits. The user retains ownership
of pushing and deployment.

---

## Appendix

### Planning Validation Record

The completed independent review used native dispatch requested as Codex Astra
(`gpt-6-astra`) with extra-high reasoning (`xhigh`). The dispatch did not
provide an independent serving-model receipt. The reviewer read the plan,
source, configuration, documentation, and cached dependency source. The reviewer
ran no tests and opened no server or browser.

The reviewer found one required correction: Phase 4 consumes Phase 2's browser
baseline and must declare that dependency. The plan now declares that dependency
in both the phase order and Phase 4. Source inspection confirmed the dependency
and the correction.

The review also identified two useful clarifications in the behavior harness.
The existing evaluator does not inject DOM constructors or expose callbacks
beyond the observer. Phase 3 now specifies captured listener delivery; Phase 4
permits narrow constructor wiring while retaining behavior assertions. These
corrections change the verification instructions, not the product contract.

The reviewer found no additional architectural blocker or necessary phase split.
The main agent checked each retained finding against the cited source and
corrected the plan. The reviewer reread the corrected sections and accepted the
plan. The reviewer also requested a distinction between baseline measurements
and measurements after the proposed changes. The deferred-measurement wording
now makes that distinction. Implementation checks, browser comparison, and the
deliberate JavaScript error probe remain future evidence.

### Source Map

The Findings Review gives the detailed source evidence and disposition for each
issue. `CLAUDE.md`, `docs/design.md`, and plan 019 establish the current
static-site and recorded-proof direction. Plans 007 and 011 record the accepted
test dependency and single convention authority. Plans 014 through 016 explain
the unfinished checking work; their old diagnostic counts are not current
measurements.

No external product source or upstream compiler execution is necessary to
preserve the checked-in site. The reset changes neither upstream product claims
nor their evidence.
