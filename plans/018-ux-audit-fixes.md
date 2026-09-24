# Homepage UX audit fixes

Status: DONE

## Objective

Make the proof demonstration accurate, give visitors control over the example,
explain the verdict and repair scope, and make installation easier to assess.

## Constraints

- Keep the page usable without JavaScript. The initial editor stays read-only
  with a pre-rendered proof.
- Keep the real WASM analyzer as the source of live verdicts. Label sample
  repair actions as replays.
- Keep the current visual language, static server, and one-page route.
- Work on local main. Run `deno task verify` before each commit. Do not push.
- Inspect desktop and narrow layouts. Close browsers and free port 8000 after
  testing.

## Work

1. Correct the Date.now sample so the analyzer reports the intended failure.
2. Start the sample only on request. Add a visible Reset example action.
3. Explain declared proof scope and the strict default example. Keep the full
   analyzer guidance available behind a native disclosure.
4. Say before a repair action that it replays a known plan. Handle certificate
   copy failure.
5. Add install script inspection and platform text beside both install commands.
   Reduce blank editor space for the short mobile example.
6. Update the sitemap date, verify behavior and visual states, review the diff,
   and commit each complete unit.

## Evidence and decisions

The 2026-09-23 live audit found that the Date.now action first reported ZTS001
for object shorthand. The strict default example was blocked before a new
perturbation. The 400 px view showed empty editor space below that short source.
The source confirms automatic playback, no visible Reset, and no failure path
for certificate copy. The current install script responds at the existing raw
GitHub URL and supports macOS and Linux on x86_64 and aarch64.

## Result

The playground now starts still and runs its proof and repair sample only on
request. The Date.now sample reaches the intended determinism failure in the
real WASM analyzer. Reset restores the selected seed. The proof card separates
declared specs from analyzed properties and keeps full strict-default guidance
available. Install notes beside both commands name supported platforms and link
to the script. Desktop and 375 px browser checks passed. The full project
verification passed, and the test browser and server were closed.
