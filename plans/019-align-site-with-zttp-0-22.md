# Align the site with zttp 0.22

Status: DONE

## Objective

Remove every homepage claim that zttp 0.22.0 made false. Replace the WASM
playground with static, real analyzer output. Keep the v0.21.0 version label and
download link until a 0.22 tag is on GitHub.

## Decisions (user, 2026-10-17)

- D1 (a): remove the playground. Show recorded analyzer output in its place.
  zttp commit `405aaaf5` (plan 005 G2) removed `zig build wasm` and
  `scripts/build-wasm-playground.sh`, so the playground cannot be rebuilt. The
  shipped analyzer is from 0.21.0, which had the flow fail-opens that 0.22.0
  fixed (a secret returned through a `routerMatch` route proved
  `no_secret_leakage`).
- D2 (a): fix the copy now. Change the `v0.21.0` nav label, the
  `releases/tag/v0.21.0` link, and the "Download v0.21.0" text only after a 0.22
  tag is pushed. Only `v0.21.0` is on origin today.

## Constraints

- Work on local main. Run `deno task verify` before each commit. Do not push.
- The page stays usable without JavaScript. The new section is static HTML.
- CSP: remove grants the site no longer needs; add none.
- Prefer deletion. Reuse existing classes (`z-section`, `z-code-card`,
  `z-pane-title`, `z-section-head` and the like) before adding CSS.
- No emojis. No em dashes. Plain words, sentences under 25 words.
- After any browser check, close the browser and free port 8000.

## Facts from zttp (checked 2026-10-17 against zttp `20caa237`)

- 0.22.0 removed `zttp:tool` (tool routes), application invariants (ledger
  balance), `zttp:durable`, `zttp:workflow`, hypermedia, TSX, and Studio.
- `docs/durable-workflows.md` and `docs/hypermedia-explainer.html` no longer
  exist in zttp. `docs/restrictions-to-proofs.md`,
  `docs/proofs-and-receipts.md`, `docs/roadmap.md#agent-compiler-agenda`,
  `STRATEGY.md`, `install.sh`, and `docs/user-guide.md#first-project` exist.
- `zts check` on a try/catch handler prints
  `error[ZTS001]: 'try/catch' is not supported; use Result types for error handling`.
- Latest `docs/convergence.md` row (2026-10-13, commit `824b7376`): 13 cases,
  DeepSeek V4 Flash, raw first-draft pass 9/13, first-attempt green 9/13, median
  round-trips 4, intent pass 13/13. The intent denominator is the cases that
  carry an intent spec; here that is all 13.
- `zttp init <name> --template api`, `zttp verify <url>`, and
  `GET /.well-known/zttp-attest` exist.

## Work

### U1: remove the tool-route and invariant section

Delete `<section class="z-section" id="tools">` in `static/index.html` whole
(about lines 594-695). In the JSON-LD `keywords`, delete
`agent tool routes, application invariants,`. Delete CSS rules whose selectors
match only markup in that section (check each with grep before deleting).

### U2: fix the remaining stale copy

1. Hero transcript: no try/catch repair exists in zttp. The repair surface in
   `ZTTP/packages/zts/src/repair_validator.zig` includes compound assignment
   (`x += e` to `x = x + e`, line 547). Rewrite the transcript around that
   repair. Keep the existing span classes and line layout. New content:
   ```
   $ zttp expert "count retries in the webhook"

   [agent]    draft 1: simulating before write
   [veto]     draft adds a violation
     error[ZTS613]: compound assignment is not part of canonical ZigTS
       --> handler.ts:12:5

   [compiler] typed repair: attempts += 1 -> attempts = attempts + 1
   [compiler] applied with no model call
   [compiler] compiler-authored repair passed aggregate proof
   ```
   Delete the old `PROVEN  3/3 declared | 6/7 properties` line: no command
   prints it. The last line is the real string at
   `ZTTP/packages/pi/src/loop.zig:767`. Figcaption: "The compiler rejects the
   draft, repairs it with no model call, then proves it."
2. Evidence "Measured" card: replace the sentence with "On a fixed set of 13
   coding tasks, 9 first drafts from DeepSeek V4 Flash pass the compiler
   unchanged. All 13 reach a proven handler, and all 13 pass their intent
   tests." (Source: `ZTTP/docs/convergence.json` row `824b7376`:
   rawFirstDraftPasses 9, finalGreens 13, intentPasses 13 of 13.)
3. Install section: the sentence "The compiler, CLI, and browser playground do
   not." becomes "The compiler and CLI do not." The sentence "watch the compiler
   name the broken guarantee and the line" becomes "watch the compiler name the
   rule and the line".
4. Evidence "Runtime and workflow details" disclosure: delete the
   `durable-workflows.md` and `hypermedia-explainer.html` links. Rename the
   summary to "Runtime details". Keep "Proofs and receipts".

### U3: replace the playground with recorded output

1. Delete `<section class="z-section z-playground" id="playground">` (about
   lines 209-516) and the `playground.js` and `proof-juice.js` script tags.
   Delete `static/playground.js`, `static/proof-juice.js`,
   `static/zts-analyzer.85b8ac568655.wasm`, and
   `tests/playground_behavior_test.ts`.
2. Add `<section class="z-section" id="proof">` in the same place. Content:
   - Eyebrow: "Real analyzer output". Heading: "Break one guarantee. The
     compiler names it."
   - One sentence: "This handler declares three guarantees and returns an
     environment secret in its response. `zts check` refuses it and names the
     guarantee that broke."
   - A `z-code-card` titled `handler.ts` with the source below, verbatim.
   - A `z-code-card` titled `zts check handler.ts` with the text excerpt below,
     verbatim. Mark the ZTS500 line with `z-err` and PROVEN values with
     `z-safe`. Do not style the `---` row as an error: it means "not proven".
   - A third `z-code-card` titled `zts check --json handler.ts` with the ZTS400
     record excerpt below. It carries the leak line (11:23), which the text
     report does not print.
   - A caption: "Output of zts check from zttp 0.22 at commit 20caa237. `---`
     means not proven. The excerpt omits the parse, verification, and property
     sections (all OK or PROVEN), the path statistics, and the footer."
3. Nav: change `<a href="#playground">Try</a>` to `<a href="#proof">Proof</a>`.
   Hero button: change `href="#playground"` and "Try it in your browser" to
   `href="#proof"` and "See a proof break".
4. `main.ts`: remove `'wasm-unsafe-eval'` from `script-src` and the `.wasm`
   content-type entry.
5. `static/style.css`: delete every `.z-playground`, `.zp-*`, and proof-juice
   rule (canvas and burst). Grep each selector against `static/index.html` and
   `static/404.html`; delete any rule left with no matching markup. Add only the
   rules the new section needs. Bump `style.css?v=` in `index.html` (and in
   `404.html` if it references the stylesheet).
6. Tests:
   - `tests/site_contract_test.ts`: delete the WASM artifact test, the "failed
     analysis" test, the "editor keydown" test, the "hidden diagnostics" test,
     the `.z-playground:not(.zp-js)` assertion, and the calm-strip assertion.
     Invert the CSP check: assert the CSP does not grant `'wasm-unsafe-eval'`
     ("the site loads no WebAssembly").
   - Add a test "every in-page link has a target": each `href="#x"` in
     `index.html` has an element with `id="x"`.
   - Add a test "the homepage advertises no removed zttp feature": the HTML does
     not contain `zttp:tool`, `durable-workflows`, `hypermedia-explainer`,
     `playground.js`, or `.wasm`.
   - `tests/script_behavior_test.ts`: use `proof` where it uses `playground`,
     and fix the header comment that refers to the playground harness.
7. Docs in this repo: update `CLAUDE.md` (Layout entries for `playground.js`,
   `proof-juice.js`, the wasm, the playground test, the no-JS sentence in the
   `script.js` entry, the `.zp-*` sentence in the `style.css` entry, and the
   inline-script convention that names `playground.js`, and the wasm half of the
   asset-renaming convention at lines 98-99). Update `docs/design.md`: the
   tool-routes row (line 16), the ledger-invariant line (32), the hypermedia
   mention (36), and the playground and particle-burst lines (50, 55, 68).
   Update `docs/plan.md` lines 19, 27, and 33, which name the playground and
   `static/playground.js`.

### U4: record the change

Set `lastmod` in `static/sitemap.xml` to 2026-10-17. Add "Iteration 6: zttp 0.22
alignment" to `docs/evolution-log.md` in the existing entry format. Set this
plan to `Status: DONE`.

## Recorded source (handler.ts)

```ts
import { env } from "zttp:env";

structural Guardrails<T> = Proof<T,
  | "deterministic"
  | "no_secret_leakage"
  | "injection_safe"
>;

function handler(req: Request): Guardrails<Response> {
  const key = env("API_KEY") ?? "";
  return Response.json({ ok: true, key: key });
}
```

## Recorded output excerpt (zts check, zttp 0.22.0, exit 1)

```
check: handler.ts

  Security:
    no_secret_leakage ... ---
    no_credential_leak .. PROVEN
    input_validated ..... PROVEN

  Spec diagnostics:
    ZTS500 (error) handler.ts:9:17  declared Proof capsule was not discharged by handler proof (failing spec: no_secret_leakage)
```

## Recorded JSON excerpt (zts check --json, same run)

Pretty-print this one diagnostic record from `/tmp/webchk/handler.json`:

```json
{
  "code": "ZTS400",
  "severity": "error",
  "message": "secret data flows into response body",
  "file": "handler.ts",
  "line": 11,
  "column": 23,
  "suggestion": "env vars with sensitive names (SECRET, PASSWORD, KEY, TOKEN) must not appear in responses"
}
```

The full text run is in `/tmp/webchk/handler.out` (source
`/tmp/webchk/handler.ts`). Copy lines from that file only; do not retype them.

## Verification

- `deno task verify` passes after each unit.
- `grep -rn -E 'playground|zp-|wasm|proof-juice|zttp:tool|durable|hypermedia' static main.ts tests CLAUDE.md AGENTS.md`
  returns only intended hits.
- Serve with `deno task start`. Check `/` at 1280 px and 400 px wide, with and
  without JavaScript. Then stop the server and free port 8000.

## Commits

One commit per unit: U1, U2, U3, U4.

## Validation record

Fable reviewed the reasoning and copy on 2026-10-17. Accepted: the excerpt hid
the ZTS400 leak line (added the JSON card); the caption named the wrong version
(now names commit `20caa237`); the hero claimed a try/catch repair that has no
producer (rewritten around the ZTS613 compound-assignment repair); two install
sentences still named the playground or a "broken guarantee" (U2 item 3). Codex
astra did not run: the account hit its usage limit. The plan author checked the
file facts instead and added the `docs/design.md` and `docs/plan.md` lines.
