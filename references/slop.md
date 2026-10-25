# Design lint: defaults and tells

`shoot.mjs` runs a lint on every capture. It reads computed styles and layout on the rendered page, not your source, so it works for any framework. It knows patterns, not taste: once it's clean, you still have to look.

## `fix` — must be fixed before review or delivery

| Rule | What it catches | Usual fix |
| --- | --- | --- |
| lowContrast | Text below 4.5:1 (3:1 for ≥ 24px or ≥ 18.66px bold) against its real background | Use `--ink-2/3` or `--accent-text`, not opacity or ad-hoc grays |
| tinyText | Text under 12px | Use `--step-n2` or larger |
| tightLeading | Text that actually wraps to 2+ lines with line-height < 1.25 | Use `--leading-body`; or stop it wrapping (`nowrap` + ellipsis) if it shouldn't |
| hScroll | Page wider than the viewport | Find the widest element; `min-width: 0` on grid/flex children is the usual cure |
| clipped | Text cut off by `overflow: hidden` without an ellipsis | Allow wrap, add ellipsis, or give it room |
| stuckHidden | Text in the first screen at opacity ≈ 0 | An entrance animation that never ran; make the final state the default |
| missingAlt | `<img>` without `alt` | Describe it, or `alt=""` if decorative |
| smallTarget | Interactive element under 32px on narrow viewports | Increase hit area (padding or a pseudo-element) |

`check` — **overlap**: two text blocks overlap. Usually a bug; occasionally a deliberate layered composition. Look at the screenshot.

## `tell` — AI-default tells: remove, or justify in the delivery notes

These aren't wrong in themselves; they're what generated UIs reach for when nobody decided. Each one you keep needs a one-line reason tied to the direction.

| Tell | Why it reads as generated |
| --- | --- |
| Gradient-filled text | Decoration standing in for hierarchy |
| Emoji as icons | No icon decision was made |
| Tiny uppercase eyebrow above a heading | Default "section label" scaffolding; usually repeats the heading |
| Rounded card with a colored side stripe | Default "callout" pattern |
| Card nested inside a card | Boxes used instead of spacing and hierarchy |
| Glow blob / aurora background | The AI-tool look; says nothing about the product |
| Purple-blue gradient | Same |
| Glassmorphism on several surfaces | Blur used as style, costly and low-contrast |
| Icon-in-tinted-tile feature grid | The template's "three features" section |
| Pills on nearly every control | One shape applied without a grammar |
| More than 3 font families | No type system |
| Only Inter/Roboto/Arial/system fonts | No type decision |
| Centered paragraphs over 3 lines | Hard to read; template hero copy |
| Lines over ~90 characters | Measure ignored |
| Gray text on a colored background | Muddy; tint toward the background or use on-color |

## Tells the lint can't see

Check these by eye on the screenshots:

- The **left text / right image** split hero on every direction.
- **"Hero, three features, testimonial, CTA"** with nothing specific to the product.
- **Fake social proof**: invented logos, testimonials, "10,000+ teams", star ratings. Never ship invented proof.
- **Placeholder realism**: "John Doe", "Lorem ipsum", "$99", "Feature One", stock photos of people pointing at laptops.
- **Uniform everything**: every section the same height, the same card, the same radius, the same shadow.
- **Over-explaining**: a paragraph under every heading restating the heading.
- **Decorative numbers**: "01 / 02 / 03" labels on things that aren't steps.
- **Generic dark mode**: near-black + one neon accent + glow, regardless of product.
- **Icon soup**: an icon beside every label.
- **Spinner instead of a result**: loading states that don't show what's coming.

False positives happen (real step numbers, a genuinely needed label). Note them in one line and move on. Errors in the console unrelated to the UI (401/404 from an unwired API) get one line in the notes; don't change business code to silence them.
