# Lean Homepage Design

## Goal

A skeptical TypeScript developer should understand zttp within one screen, see a
proof break in real analyzer output, and know how to install the CLI.

## Content Architecture

The homepage has five content sections:

1. Hero: the product claim, one action, one install command, and one veto
   transcript.
2. Proof: recorded `zts check` output for a handler that returns a secret, with
   the source, the text report, and the JSON record of the leak.
3. One write path: four steps from draft to proven write.
4. Evidence: three evidence grades and a compact runtime proof carrier.
5. Install: one command, the first three CLI steps, and two links.

The header contains Proof, Docs, GitHub, and Install. The footer contains
GitHub, Docs, Releases, and Strategy.

## Information Depth

The visible page carries the product decision, workflow, evidence grade, and
first action. Technical depth uses native `details` elements:

- Why zts restricts TypeScript
- Comparison with bolt-on checkers
- Full claim ledger
- Runtime documentation

Release policy, the complete CLI reference, detailed workflows, and product
refusals belong in repository documentation.

## Visual Direction

Deep Field: the ink-teal night of the logo, from the SLX waitlist palette. Film
grain and a slowly drifting aurora make the ground, Instrument Serif italic
carries display type, and panels are glass. Colour has fixed meanings: lime is
proven, rose is a veto, and the logo orange is the one action colour. The
recorded proof output is the page's main evidence.

The signature is the logo's three orange speed streaks trailing into the
headline, which fades from ice to lime at "proves it." Motion carries meaning: a
sweep over the transcript as the compiler simulates, and a rose-to-lime rule
along the write path. Every effect animates transform, opacity, or a shadow, and
stops under reduced motion.

## Interaction Contract

The page works without JavaScript. The proof section is static HTML: recorded
`zts check` output from a named zttp commit, with no live analyzer. JavaScript
only enhances navigation and the copy controls.

Technical disclosures use native `details` and `summary`. The mobile menu is the
only drawer-like interaction.

## Success Checks

- The hero explains the product without relying on the terminal.
- Section headings alone tell the complete story.
- The proof section stays readable at desktop and mobile widths.
- A visitor can reach installation from the header, hero, or closing section.
- Hidden detail remains keyboard accessible and useful without JavaScript.
