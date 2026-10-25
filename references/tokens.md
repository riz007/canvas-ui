# Tokens

Direction cards are data. `tokens.mjs` turns a card into CSS custom properties so every direction is customizable by changing a few numbers — by you, or by the user in the canvas **Tune** panel. Both use the same engine (`scripts/lib/tokens-core.js`), so what the user sees while tuning is exactly what you'll generate.

```
node <skill>/scripts/tokens.mjs <dir | card.json> [--specimen] [--set tone.energy=80] [--set color.accent=#e4572e] [--json]
```

Writes `<stem>.tokens.css` (with a Google Fonts `@import` for named families) and prints contrast checks. `--specimen` adds a page with swatches, type scale and controls.

## Inputs → outputs

| Card input | Drives |
| --- | --- |
| `color.bg`, `color.ink`, `color.accent` | All color tokens, mixed in OKLab |
| `color.extra` | Extra named colors, passed through (`--water`, `--contour`) |
| `tone.energy` | Type ratio (with weight), display tracking, durations, spring overshoot |
| `tone.finish` | Border width, shadow softness (raw → hard offset shadows) |
| `tone.density` | Base size, spacing unit, body line-height, measure |
| `tone.weight` | Display weight, type ratio, shadow depth |
| `tone.formality` | Radius scale |
| `type.display/body/mono` | Font stacks and weights; `type.ratio` and `type.base` pin the scale |
| `tokens` | Explicit overrides; always win |

## Token reference

| Group | Tokens |
| --- | --- |
| Color | `--bg --surface --surface-2 --line --line-strong --ink --ink-2 --ink-3 --ink-faint --accent --accent-text --on-accent --accent-hover --accent-soft --focus` |
| Type | `--font-display --font-body --font-mono --weight-display --weight-body --step-n2 … --step-6 --leading-body --leading-tight --tracking-display --measure` |
| Space | `--space-1 … --space-9` (2px grid; roughly 4·8·12·16·24·32·48·64·96 at medium density) |
| Shape | `--radius-sm --radius --radius-lg --border --shadow-1 --shadow-2` |
| Motion | `--dur-1 --dur-2 --dur-3 --ease-out --ease-spring` |

Guarantees:

- `--ink`, `--ink-2` (≥ 6:1), `--ink-3` (≥ 4.5:1) and `--accent-text` (≥ 4.5:1) pass WCAG AA on `--bg`. `--ink-faint` is for non-text.
- `--on-accent` is whichever of near-black or white reads better on the accent. If it's still under 4.5:1 the generator warns: move the accent.
- `--step-n2` ≥ 12px, `--step-n1` ≥ 13px. Steps 3+ are fluid (`clamp`).

Use `--accent` for fills and `--accent-text` for accent-colored text and links: a bright accent often fails as text.

## Using tokens in a project

- **Plain CSS**: link the generated file, or paste the `:root` block into the global stylesheet.
- **Tailwind v4**: put the variables in `@theme` (rename to Tailwind's namespaces, e.g. `--color-accent`, `--spacing-*`), or reference them with arbitrary values `bg-(--accent)`.
- **Tailwind v3**: map `theme.extend.colors.accent = "var(--accent)"` etc.
- **CSS-in-JS / native**: `--json` prints the values to transform.
- **Existing design systems**: don't replace them. Map the chosen direction onto the project's existing token names and change only what the direction requires.

Dark mode: write a second card (`a-dark.direction.json` with dark `bg`/`ink`), generate it, and scope its block under `@media (prefers-color-scheme: dark)` or `[data-theme="dark"]`.

## When to override

Override a derived token in the card's `tokens` field only with a reason ("radius 0 everywhere: the engine is Swiss signage"). If you find yourself overriding many, the dials are wrong; move the dials instead.
