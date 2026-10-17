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
