# Plan 017: Remove the deck and serve one stylesheet

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. Touch
> only the files listed as in scope. If any STOP condition occurs, stop and
> report; do not improvise around it. When done, update the status row for this
> plan in `plans/README.md`, unless a reviewer says they maintain the index.
>
> **Drift check, run first**:
> `git log --oneline -1 && wc -l static/style.css static/home.css static/deck.html && grep -c 'home.css' static/index.html static/404.html`
> Expect `style.css` near 1217 lines, `home.css` near 2125, `deck.html` near
> 1009, and exactly one `home.css` reference in each HTML file. If `deck.html`
> is already gone or `home.css` is already merged, stop and report.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MEDIUM (a visual regression is possible; the homepage must render
  the same after the merge)
- **Depends on**: none
- **Category**: cleanup
- **Planned at**: commit `ec2cbbb` and 2026-09-23
- **Affects**: plan 014 (TODO), which cites `static/deck.html:983` and asks to
  keep `script.js?v=` in sync with the deck. Step 1.9 updates it.

## Decisions (made by the owner, do not reopen)

1. Delete the pitch deck and all its content. Nothing moves to the homepage.
2. `/deck` and `/deck.html` both answer `301` with `location: /`.
3. The unified stylesheet keeps the existing name `static/style.css`.
   `static/home.css` is deleted.

## Why this matters

The site has two pages that share a stylesheet in name only. Of the 115 class
selectors in `static/style.css`, the homepage, the 404 page, and their scripts
use four: `active`, `open`, `no-js`, and `skip-link` (measured at `ec2cbbb` by
matching `style.css` classes against `class="..."` in `index.html` and
`404.html` plus `classList` calls in the two scripts). `skip-link` is also
redefined in `home.css`. About 1100 of the 1217 lines exist only for the deck.

The shared base also leaks old design values into the homepage:

- `html { background: var(--bg) }` (`static/style.css:52`) is still `#f4f7f1`.
  It shows during overscroll and anywhere `body` does not cover.
- `::selection` uses the old blue `rgba(110, 173, 219, 0.25)`.
- `--nav-height: 56px` (`static/style.css:15`) feeds the scroll spy in
  `static/script.js:95-100`, but the homepage header is now 72px
  (`.z-nav { min-height: 4.5rem }` in `home.css`). The spy offset is 16px short.
- The deck is the only remaining user of the Outfit font and the old tokens.

With the deck gone, one small base plus the homepage rules is the whole site.

## Current state (at `ec2cbbb`)

- `main.ts:93-98`: `/deck.html` 301s to `/deck`; `/deck` rewrites to
  `/deck.html`.
- `static/sitemap.xml:9-14`: a `<url>` entry for `/deck`.
- `static/index.html` and `static/404.html` load `/style.css?v=20` then
  `/home.css?v=32`.
- `static/script.js` (244 lines):
  - lines 5-8: `initMenuToggle` comment names the deck burger.
  - line 9: `initMenuToggle` takes a `buttonActiveClass` parameter that only the
    deck passes.
  - lines 73-79: deck burger `initMenuToggle(".nav-burger", ...)` call.
  - lines 82-84: the spy selector includes `.nav-links a[href^="#"]` (deck).
  - lines 95-100: `--nav-height` read with a 56 fallback.
  - line 102: comment says "deck navigation included".
  - lines 125-244: slide deck navigation block (`if (deck) { ... }`).
- `tests/site_contract_test.ts` (418 lines):
  - lines 29-33: asserts `/deck.html` redirects to `/deck`.
  - line 114: the image-reference test reads `static/deck.html`.
  - lines 280-310: "homepage and deck are usable before enhancement" reads
    `deck.html` and `style.css` and asserts `.no-js .deck-slide`.
  - line 363: reads `static/home.css` for the `.zp-why[hidden]` contract.
  - lines 371-384: "an optional enhancement cannot abort deck navigation".
  - lines 386-418: "deck navigation exposes current and announced state".
- Images: every file in `static/*.png|jpg|jpeg|ico` is also referenced by
  `index.html` or `manifest.json`, so the image test still passes without the
  deck. Verified at `ec2cbbb`.
- CSP (`main.ts:1-12`): `fonts.googleapis.com` and `fonts.gstatic.com` stay; the
  homepage still loads JetBrains Mono.
- `CLAUDE.md` lines 11, 23-27, 109-110, 119-121 describe the deck, and the
  Layout section describes `home.css`.
- `docs/solutions/ui-bugs/fail-closed-progressive-enhancement.md` mentions the
  deck 5 times; `docs/evolution-log.md` once. These are history.
- Pre-existing, out of scope: `static/404.html` uses `class="z-nav-cta"`, which
  no stylesheet defines. Record it; do not fix it here.

## Commands you will need

```
deno task verify                           # fmt, lint, check, test
deno task start                            # serve on :8000
curl -sI http://localhost:8000/deck        # expect 301, location: /
curl -sI http://localhost:8000/deck.html   # expect 301, location: /
lsof -nP -iTCP:8000 -sTCP:LISTEN           # must be empty at the end
```

## Scope

In scope: `main.ts`, `static/deck.html` (delete), `static/home.css` (delete),
`static/style.css`, `static/index.html`, `static/404.html`, `static/script.js`,
`static/sitemap.xml`, `tests/site_contract_test.ts`, `CLAUDE.md`,
`plans/README.md`, `plans/014-typecheck-script-js.md`.

Out of scope: `static/playground.js`, the wasm artifact, the CSP, the manifest,
`docs/` history files, and any visual change to the homepage beyond the three
leaks listed above.

## Git/workflow guidance

Work on local main. Two commits, one per phase. Run `deno task verify` before
each commit. Never push.

## Phase 0: capture a visual baseline

1. Start the server. With Playwright, take full-page screenshots of `/` and
   `/outside-the-fence` at 1280x900 and 390x844 into `.playwright-mcp/`
   (gitignored). Name them `baseline-*.png`. Before each homepage capture, run
   `document.getElementById("playground").style.visibility = "hidden"` in the
   page: the playground shows a live timing ("proved in 0.8 ms") and an animated
   attract demo, so it never renders the same twice. Keep its box so the layout
   below it does not move. Stop the server.

## Phase 1: remove the deck (commit 1)

1. `git rm static/deck.html`.
2. `main.ts:93-98`: make both `/deck` and `/deck.html` return
   `permanentRedirect("/")`. Delete the `/deck` rewrite line. Keep the
   `/index.html` redirect as it is.
3. `static/sitemap.xml`: delete the `/deck` `<url>` block. Do not change the
   homepage `lastmod`; the homepage content does not change.
4. `static/script.js`:
   - delete the deck burger call (lines 73-79);
   - delete the slide deck navigation block (lines 125-244);
   - drop `.nav-links a[href^="#"],` from the spy selector (line 83);
   - remove the `buttonActiveClass` parameter and its one use from
     `initMenuToggle`, since no caller passes it now;
   - rewrite the comments at lines 5-8 and 102 so they no longer name the deck.
     The try/catch around the spy stays: it still keeps a spy failure out of the
     console as an uncaught error.
5. `static/index.html`: bump `script.js?v=` by one.
6. `tests/site_contract_test.ts`:
   - lines 29-33: assert that `/deck.html` and `/deck` both redirect to `/`;
   - line 114: remove `source("static/deck.html")` from the image test;
   - lines 280-310: rename the test to "homepage is usable before enhancement";
     remove every `deck` read and assertion, including `.no-js .deck-slide`;
     keep the homepage, script, and playground assertions;
   - lines 371-384 and 386-418: delete both deck tests.
7. `CLAUDE.md`: remove the deck from Stack, Layout, Routing rules, and step 3 of
   "When adding a new page". Add the routing rule "`/deck`, `/deck.html` -> 301
   to `/` (the deck was removed)".
8. Verify: `deno task verify` passes. `grep -rn -i deck main.ts static tests`
   returns only the redirect lines in `main.ts` and the redirect test.
9. `plans/014-typecheck-script-js.md`: add a note at the top that plan 017
   removed `static/deck.html` and the deck code in `script.js`, so every
   `deck.html` reference and deck line number in 014 is void and the executor
   must re-measure. Do not rewrite 014 itself.
10. Commit: `refactor: remove the pitch deck`.

## Phase 2: one stylesheet (commit 2)

1. Build the new `static/style.css` in this order:
   1. A base block that replaces lines 1-106 and 265-298 of the old file:
      - the universal reset (`*, *::before, *::after` margin, padding,
        box-sizing), kept exactly;
      - `:root` holding the design tokens now declared on `.zttp-home` in
        `home.css` (move them up, unchanged in value), plus `--nav-height: 72px`
        to match the real header;
      - `html`: smoothing, `scroll-behavior: smooth`, `overflow-x: clip`, and
        `background: var(--z-bg)` (white). This closes the overscroll leak;
      - `[id] { scroll-margin-top: ... }`, kept;
      - `::selection` in the berry accent: `background: var(--z-accent-soft)` is
        too faint to see on white, so use
        `color-mix(in srgb, var(--z-accent) 22%, transparent)` and
        `color: var(--z-ink)`;
      - the reduced-motion block, kept once (merge with the one in `home.css`).
   2. The full contents of `home.css`, minus: its token declarations (moved to
      `:root`), the `.zttp-home::before { display: none }` rule (the grain
      overlay no longer exists), and its duplicate `.skip-link` rules if the
      base keeps one copy. Delete from the old file everything not listed above:
      the old tokens, the Outfit font variables, the grain overlay, the global
      `a` and `:focus-visible` rules (home.css already has scoped ones),
      `.container`, `.nav*`, and every deck and slide rule.
2. Keep the `.zttp-home` prefixes and `.z-*` class names. Renaming them is not
   part of this plan; `.zttp-home a` and `.zttp-home .z-button-primary` depend
   on that specificity.
3. `git rm static/home.css`.
4. `static/index.html` and `static/404.html`: remove the `home.css` link and set
   `style.css?v=21`.
5. `static/script.js:95-100`: change the fallback from 56 to 72 and update the
   comment to point at `--nav-height` in the unified `style.css`. Bump
   `script.js?v=` again.
6. `tests/site_contract_test.ts`: every `source("static/home.css")` becomes
   `source("static/style.css")`; rename local `homeCss` variables to `css`. The
   asserted selectors (`.js .z-menu-button`,
   `.z-playground:not(.zp-js) .zp-tabs`, `.zp-why[hidden]`) must still be
   present in the merged file.
7. `CLAUDE.md`: Layout lists one stylesheet, `static/style.css`, that holds the
   base and the homepage and 404 styles, including the `.zp-*` playground.
   Remove the `home.css` bullet and the redesign-history sentence about dropped
   pre-v3 selectors.
8. Verify, then commit: `refactor(css): merge home.css into style.css`.

## Test plan

1. `deno task verify` passes after each phase.
2. With the server running:
   - `curl -sI localhost:8000/deck` and `/deck.html`: `301`, `location: /`;
   - `curl -sI localhost:8000/`: `200`; `/outside-the-fence`: `404`;
   - `curl -sI localhost:8000/home.css`: `404`.
3. Visual parity: take the same four screenshots as Phase 0, with the playground
   hidden the same way, as `after-*.png`. Compare each pair pixel by pixel
   (ImageMagick `compare -metric AE`, or a short Pillow script). The expected
   difference count is zero for all four. If it is not zero, open the pair and
   look before deciding.
4. Check the playground by eye instead: a screenshot of `#playground` at 1280
   before and after must show the same layout, colors, and fonts. Click one
   perturbation button and confirm the card flips to BLOCKED.
5. In the browser, check computed values: `html` background is
   `rgb(255, 255, 255)`; selecting text shows the berry tint; the scroll spy
   marks the correct nav link when a section's heading sits just under the
   header.
6. Tear down: stop the server, close the browser, and confirm `lsof` shows
   nothing on :8000.

## Done criteria

- `static/deck.html` and `static/home.css` do not exist.
- The homepage and 404 load exactly one first-party stylesheet.
- `/deck` and `/deck.html` 301 to `/`.
- No live file mentions the deck except the redirect and its test.
- `style.css` has no selector without matching markup or script usage.
- Screenshots match the baseline (zero differing pixels, playground hidden).
- `deno task verify` passes; two commits exist; `plans/README.md` shows 017
  DONE.

## STOP conditions

- The pixel comparison is not zero and the cause is not an intended change.
- The image-reference test fails after the deck is removed (a file was deck-only
  after all).
- Any test asserts a deck behavior that this plan did not list.
- A selector the tests require is missing from the merged stylesheet.

## Maintenance notes

- After this plan, CLAUDE.md "When adding a new page" still applies, but there
  is no second page to mirror. A new page should load `style.css` and reuse the
  `.zttp-home` body class, or the plan that adds it should decide on a neutral
  root class.
- Search engines drop `/deck` from the index over time; the 301 keeps old links
  useful meanwhile. Removing the redirect later needs its own decision.
