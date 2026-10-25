# Visual language

Work from the whole to the part: skeleton → hierarchy → type → color & surfaces → controls & icons → details. Fixing a button radius while the page has two competing heroes is wasted effort.

## Hierarchy and space

- **One hero per screen.** Name it. Everything else is ranked below it by size, weight, contrast or position — and usually by *more than one* of those at once. Two things with equal emphasis read as noise.
- **Rank with as few tools as possible.** Prefer size and space before color; color before borders; borders before boxes. Every box you add is a decision you couldn't make with spacing.
- **Proximity is grammar.** Space inside a group < space between groups < space between sections, in visible steps (e.g. 8 / 24 / 64). A heading sits closer to the text it introduces than to the text above it.
- **Use the token spacing scale** (`--space-1…9`). Off-scale values are a smell unless optical.
- **Align to fewer edges.** Count the distinct left edges on a screen; fewer is calmer. Break alignment only on purpose.
- **Whitespace is not a style.** Dense tools should be dense; editorial pages can breathe. The `density` dial decides, not habit.

## Type

- **Two families is usually enough** — display + body, plus mono only if data or code really appear. More than three is a lint `tell`.
- **Contrast between display and body should be obvious**: different family *or* a large size and weight jump. Display at 1.3× body with the same weight is mush.
- **Pick fonts from the engine**, not from habit. Inter/Roboto/system everywhere is a lint `tell`; it's fine for body in a dense tool if the display face carries character, or if you write down why.
- **Sizes come from the scale** (`--step-n2…6`). The generator floors small steps at 12/13px; body is never below 14px on desktop or 16px on mobile inputs (iOS zooms below 16).
- **Line length** 45–75 characters for reading (`--measure`); line-height ~1.45–1.65 for body, 0.9–1.15 for display. Tracking: negative on large display, slightly positive on small caps/labels, zero on body.
- **Numbers**: use tabular figures (`font-variant-numeric: tabular-nums`) in tables, timers and prices.
- **Write real copy.** Product names, place names, prices, timestamps that look like the real thing. Lorem ipsum and "Feature one" hide layout problems.
- **Wrapping is a design decision**: use `text-wrap: balance` on headings, `pretty` on paragraphs; check the narrowest viewport. Never fix overflow by shrinking text.

### Legibility is a release gate

Lint `fix` items block delivery: text contrast below AA (4.5:1, 3:1 for ≥24px or ≥18.66px bold), text under 12px, multi-line text with line-height under 1.25, horizontal scrolling, clipped text, content stuck invisible. Token text colors (`--ink`, `--ink-2`, `--ink-3`, `--accent-text`) pass AA by construction; `--ink-faint` is for non-text only.

## Color and surfaces

- **Budget the accent.** It marks the primary action, the current selection and live state. If it's also decoration, it stops meaning anything. A useful default: ≤ 10% of the screen.
- **Surfaces step, they don't shout.** `--bg` → `--surface` → `--surface-2` differ by a few percent. Separate with space first, then a hairline (`--line`), then a surface step. Shadows only where something actually floats.
- **Gray text on color** looks dead; tint it toward the background hue or use the on-color token.
- **Dark mode is a second palette, not inverted colors.** Re-run `tokens.mjs` with a dark card; shadows mostly disappear, surfaces get *lighter* as they rise.
- **Gradients need a reason** (light, a material, a data range). Purple→blue on dark, glow blobs and aurora backgrounds are lint `tell`s.
- **Imagery carries color** when the palette is neutral: photos, product renders, the user's content.

## Controls and icons

- **One control grammar** from the card's `controls` line: same radius family, stroke weight, focus ring, pressed behavior everywhere. Buttons, inputs, chips, toggles should look like siblings.
- **States are part of the design**: default, hover, pressed (instant, ~80ms, scale 0.97–0.98 or a 1px shift), focus-visible (2px ring, offset 2px, `--focus`), disabled (lower contrast + no pointer), loading (keep the label width; don't jump).
- **Primary action looks primary in one way**, not three (filled *or* larger *or* accent — usually filled).
- **Icons**: one set, one stroke width, one size grid (16/20/24), one cap style. Icons support labels; they rarely replace them except for universal glyphs (search, close, play). Emoji as UI icons is a lint `tell`.
- **Icon sets converge too.** If every product in the category uses the same outline set, consider characters, numerals or a drawn mark.
- **Tap targets** ≥ 44px on touch (≥ 32px enforced by lint at narrow widths).

## Subtraction pass

Do it once, deliberately, before delivery:

1. For each screen, name the hero. Make everything else quieter.
2. Delete repeated explanations: if the heading says it, the paragraph doesn't need to.
3. Delete decoration that doesn't carry the north star: extra dividers, icon tiles, eyebrow labels, badges nobody reads.
4. Keep: object names, the reason behind a decision, current state, the primary action.
5. Look at 100% and 200%. Fix what only shows up close (misaligned baselines, 1px gaps, blurry icons).
