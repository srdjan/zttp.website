# Evolution Log

## Iteration 16: Member Access and Dict Types

The evidence section now states one more checker fix on the development tree. A
member call must name a member that the value holds at runtime, and an index
read on a string is refused. A typed `Dict` now reaches the `zttp:collections`
functions, and their callbacks take the key and value types. Before, six
measured handlers passed the check and then faulted at runtime. The change is in
the zttp repository and awaits release.

The release version remains 0.26.0. The update adds no routes or scripts. The
sitemap date moves to 2026-11-03.

## Iteration 15: Callback and Result Types

The evidence section now states one more checker fix on the development tree. An
annotated array callback must accept the value that the method passes. A
`Result` from a virtual module has the error type that the runtime stores, and
the `zttp:result` combinators carry types. Before, six measured handlers passed
the check with such a mismatch. The change is in the zttp repository and awaits
release.

The release version remains 0.26.0. The update adds no routes or scripts. The
sitemap date stays 2026-11-02.

## Iteration 14: Builtin Result Types

The evidence section now states one more checker fix on the development tree. A
builtin call has the type of the value that the runtime returns, such as a
number for `xs.length` and a string or `undefined` for a request header. Before,
two measured handlers stored such a value as the wrong type, passed the check,
and faulted at runtime. The change is in the zttp repository and awaits release.

The release version remains 0.26.0. The update adds no routes or scripts. The
sitemap date stays 2026-11-02.

## Iteration 13: Arithmetic Operands

The evidence section now states one more checker fix on the development tree.
`zttp check` refuses arithmetic on a value that may be `undefined` or `null`, or
that is declared `unknown`, unless a guard first proves it is a number. Before,
eight measured handlers of this kind passed the check and faulted at runtime.
The change is in the zttp repository and awaits release.

The release version remains 0.26.0. The update adds no routes or scripts. The
sitemap date stays 2026-11-02.

## Iteration 12: Function Values and Type Guards

The evidence section now states two checker fixes on the development tree.
`zttp check` refuses a function where a number, a record field, or a JSON value
is expected. It also refuses a type guard whose test does not prove its claim.
Before, handlers of these kinds passed the check and faulted at runtime. Both
changes are in the zttp repository and await release.

The release version remains 0.26.0. The update adds no routes or scripts. The
sitemap records the content change on 2026-11-02.

## Iteration 11: Check Parity and a Development Recording

The evidence section now states that `zttp check` reports the refusals of the
build on every file. It also gives a new recording of the 13 tasks on the
development tree: 8 first drafts pass unchanged, 11 handlers reach a proof, and
11 pass their intent tests. The Measured figures still describe the released
0.26.0, so the update does not change them.

The release version remains 0.26.0. The update adds no routes or scripts. The
sitemap records the content change on 2026-11-01.

## Iteration 10: File Imports Build With a Certificate

The evidence section now names one development change that awaits release. The
build commands accept a handler with file imports and produce one certificate
over every file. The compiler states that the certificate covers every file, and
the checker does not confirm that coverage. The change is in the zttp repository
and awaits release.

The release version remains 0.26.0. The update adds no routes or scripts. The
sitemap records the content change on 2026-11-01.

## Iteration 9: Compiler and Runtime Reliability

The evidence section now names development improvements that await release. The
update covers named intersections, long alias chains, callback timeouts, array
failures, and shared diagnostics from the analyzer. Flow checks also support
deep mixed expressions, nested calls, and matches within existing safety
budgets.

The reviewed fixes also protect secret paths in agent tools, correct proofs of
handler completion, and remove response bodies from HEAD status and error
replies.

A handler with no failable I/O now proves fault coverage. The build commands
refuse a handler that `zttp check` refuses. Both changes are in the zttp
repository and await release.

Flow checks now treat every `env()` value as secret unless the project policy
lists its name in `env.public`. This change is in the zttp repository and awaits
release.

The release version remains 0.24.0. The update adds no routes or scripts. The
sitemap records the content change on 2026-10-26.

## Iteration 1: zts Expert Agent Section + Design Polish

- What changed:
  - Added new "Expert Agent" section between Code and Modules showing
    agent-compiler feedback loop terminal demo
  - Added nav link for Expert section
  - Fixed section-dark alternation (Get Started is now plain since Modules is
    dark)
  - Fixed terminal pre word-break (was `break-all`, now
    `overflow-wrap: break-word`)
  - Removed code tab active panel border-left that caused layout shift
  - Added 3-column module grid breakpoint for medium screens (769-1024px)
  - Added gold accent top border on expert terminal for visual weight
  - Added scroll-triggered fade-in for pitch terminal, expert terminal, and CLI
    reference
  - Added expert section responsive stacking at 768px
- Primary metric: visitor understands the agent-compiler loop within 10 seconds
- Leading indicators: terminal demo pauses scrolling, section fits editorial
  rhythm
- Guardrails: concise feel preserved, no bloat
- Frontier note: site is feature-complete for the current product scope. Next
  frontier would be interactive demos, video content, or a dedicated docs site.

## Iteration 2: Live Proof Playground

- What changed:
  - Added a `#playground` section below the hero: a code editor beside a proof
    card
  - The card runs the real zts analyzer, compiled to WebAssembly and served from
    `static/`, so the verdict matches `zttp dev` rather than approximating it
  - Three perturbation buttons (inject `Date.now()`, leak a secret, add a
    `while` loop) flip the card red and back for visitors who do not type
  - Proof card carries four lenses: Properties, Trade, Handover, Caller view
  - Added a `Playground` nav link and a `Try it live` hero CTA
  - `main.ts`: added `wasm-unsafe-eval` to the script-src CSP and an
    `application/wasm` content type
- Primary metric: a first-time visitor sees the proof flip without installing
  anything
- Leading indicators: visitors trigger a perturbation; scroll depth reaches the
  playground
- Guardrails: the hero keeps its instant static mockup; the playground
  lazy-loads its wasm on scroll; the section degrades to a pre-rendered card
  without JS or WebAssembly
- Frontier note: the playground closes the gap the Iteration 1 note named. A
  dedicated docs site is the remaining frontier.

## Iteration 3: v0.1.1-beta Release Announcement

- What changed:
  - Added a homepage release strip for v0.1.1-beta with a direct release-notes
    link
  - Updated public version labels and download links from v0.1.0-beta to
    v0.1.1-beta
  - Refreshed the expert-agent section around the new clarify-before-guessing
    behavior and per-session metrics
  - Updated the deck version references and CLI slide copy to match the release
- Primary metric: visitors understand the new expert-agent behavior before they
  reach the install CTA
- Guardrail: no new routes, framework, or server behavior; the announcement
  stays on the existing homepage path

## Iteration 4: Lean Homepage

- What changed:
  - Reduced the homepage to five content sections and four navigation choices
  - Rewrote the hero around pre-disk proof and one primary action
  - Merged the boundary and agent narratives into one four-step write path
  - Reduced evidence and runtime copy to graded rows and one proof carrier
  - Moved technical depth into native disclosures and repository docs
  - Reduced installation to one command and the first CLI workflow
  - Removed homepage selectors that no longer match markup
  - Fixed the playground diagnostic panel hiding and pre-boot source highlight
- Primary metric: a first-time visitor can explain zttp after the hero and live
  proof
- Guardrails: the real analyzer, no-JavaScript proof preview, routes, and
  security policy remain unchanged
- Verification: Deno formatting and checks, desktop and mobile browser review,
  live proof failure, mobile navigation, disclosures, and no-JavaScript fallback

## Iteration 5: v0.21.0 Tool Routes and Plainer Copy

- What changed:
  - Added a tool-routes section for v0.21.0: checked input and output, verified
    callers, credentials the handler never sees, and balanced ledgers, with the
    real `toolCatalog` snippet from `examples/tools`
  - Rewrote the hero, playground, workflow, and install copy in plainer words
  - Replaced the "Partly proven" evidence grade with the measured convergence
    figure (14 of 19 first drafts, 19 of 19 end proven) from the zttp
    `docs/convergence.md`, and moved the open item to the small local model run
  - Added the startup proof check and tamper refusal to the proof carrier
  - Updated version labels and the download link to v0.21.0
- Primary metric: a visitor can name one v0.21.0 capability after scrolling past
  the workflow section
- Guardrails: no new routes, scripts, or origins; the new section reuses the
  evidence-row and first-proof styles

## Iteration 6: Deep Field

- What changed:
  - Replaced the white editorial theme with Deep Field, chosen from three
    variants (Deep Field, Blueprint, Daylight) built on the SLX waitlist palette
    and adjusted to the logo's electric blue and orange
  - Italic serif display type, glass panels, film grain and a drifting aurora
  - Signatures: logo speed streaks into the headline, a lime-ending headline, a
    transcript sweep, a veto-to-proven rule on the write path, row streaks
  - Game feel from the web game design system: a pooled particle burst on
    verdict flips (`static/proof-juice.js`), verdict pop, card shake, press
    squash
  - Fixed the skip link, whose colour lost to `.zttp-home a` and was unreadable
- Verification: computed styles of all 299 elements matched the approved preview
  at 1440 and 396 pixels except invisible zero-width border colours and the
  intended aurora fix; the text contrast audit found no failures; the burst
  fires under the production CSP
- Guardrails: no new routes or origins; fonts come from the existing Google
  Fonts origin; the page works without JS

## Iteration 7: zttp 0.22 Alignment

- What changed:
  - Removed the tool-routes and ledger-invariant section: zttp 0.22.0 removed
    both features
  - Removed the WebAssembly playground, its scripts, the analyzer artifact, and
    the `'wasm-unsafe-eval'` CSP grant
  - Added a static `#proof` section with recorded `zts check` output from zttp
    commit `20caa237`: the handler source, the text report, and the JSON record
    of the secret leak
  - Rewrote the hero transcript around the ZTS613 compound-assignment repair
  - Updated the measured claim to the latest convergence row: 9 of 13 first
    drafts pass, 13 of 13 end proven, 13 of 13 pass their intent tests
  - Removed the durable-workflow and hypermedia links
  - Kept the v0.21.0 version label and download link until a 0.22 tag exists
- Primary metric: every claim on the page names a feature that zttp 0.22 ships
- Guardrails: no new routes, scripts, or origins; the page works without JS
- Verification: `deno task verify`, and a browser check of `#proof` at 1280 and
  400 pixels wide

## Iteration 8: Site Version Follows zttp

- What changed:
  - The nav label, the download link, the download text, and the `deno.json`
    version now show one version: the zttp version in `../ZTTP/VERSION`
  - `deno task sync-version [X.Y.Z]` sets all four places and fails without
    changes when the version is invalid or a place is not found exactly once
  - A contract test fails when the four places name different versions
  - This supersedes the Iteration 7 note that kept the v0.21.0 label until a
    0.22 tag exists
- Primary metric: the site never shows a version that zttp does not name
- Guardrails: the zttp tag must be pushed before the site is deployed, or the
  download link points at a missing release
- Verification: `deno task verify`, and a probe of the new test in a scratch
  clone with one value changed
