# Direction

A direction is good when the best team in this category would plausibly ship it *and* it looks like this product, not like "something other than the model's default". Distinction comes from a complete, consistent language and its details — not from an unusual theme.

Contents: [Category & benchmarks](#1-category--benchmarks) · [Tone dials](#2-tone-dials) · [Vague words](#vague-words-must-be-translated) · [Engines](#3-engines) · [Color](#4-color) · [Skeleton](#5-skeleton) · [Direction card](#6-direction-card) · [Divergence test](#7-divergence-test) · [North star](#north-star-and-echo) · [The memorable moment](#the-memorable-moment) · [Using references](#using-references)

## 1. Category & benchmarks

This sets the floor: the structure users already expect and the finish level of the best products.

1. **Name the category and 2–3 peers with the most distinctive style** (not necessarily the most famous).
2. **Look at real screens.** Use the host's browser or search to capture each peer's first screen and one key control into the workspace (`refs/`). Memory shows a product as it looked years ago. If a page fails, try another URL, then another peer. Two real peers is enough.
3. **Take one apart** into 6–10 observations precise enough to rebuild: shape, size relationships, state changes, and *why* it's that way. Layers: control shape & feel, type, color, icons/illustration, states & feedback, motion, copy voice, what's on the first screen. "Clean, whitespace, one accent" means you didn't look closely; do it again.
4. **Keep or change.** Test each observation against this product's audience, content and context. Same reason holds → keep. Doesn't hold → change it, and let an engine supply the replacement.

If you truly can't get images, write "from memory — unverified" at the top of the benchmark field and mark type, color and hero as *to verify*. These three are where memory regresses to the model's defaults.

Separate three things:

- **Baseline** — what users already expect (gallery: work first, filters on top; store: cart top-right). Keep it.
- **Cliché** — the default layout everyone in the category uses. At least one direction per round breaks it.
- **Clone** — type, palette, hero and icons all match a peer. Never allowed.

## 2. Tone dials

Five dials, 0–100, each with evidence. They also drive the token generator, so they're decisions, not vibes.

| Dial | 0 ↔ 100 | Visible in | Tokens it moves |
| --- | --- | --- | --- |
| energy | quiet ↔ loud | saturation, contrast, collisions | type ratio, tracking, motion speed & overshoot |
| finish | raw ↔ refined | edges, grain, alignment strictness | border weight, shadow softness |
| density | airy ↔ dense | whitespace scale, layering, grid discipline | base size, spacing unit, line height, measure |
| weight | light ↔ heavy | type weight, color mass, shadow hardness | display weight, shadow depth |
| formality | playful ↔ formal | radius, illustration, motion amplitude | radius scale |

Every combination is legitimate. What fails is the unexamined default:

- Evidence says loud and raw; the delivery is beige cards, soft shadows and big whitespace. **This is the most common failure** — the design was sanded back to the model's "quiet premium".
- The reverse: forcing grain, torn paper and thick borders onto a product that should be calm, to seem interesting.

If evidence locks the tone, keep all three directions inside it and diverge on skeleton, color identity and hero. Don't add a "safe minimal" option for balance. Spread directions across tones only when evidence is genuinely ambiguous.

### Vague words must be translated

| Word | Translate into |
| --- | --- |
| premium | *Which* premium (editorial, Swiss, luxury retail, pro tool)? Then type contrast, separation method, spacing scale, hue count. |
| refined / polished | Tolerances: tracking, grid (4px? 8px?), max shadow levels, max hues. |
| restrained / minimal | A saturation budget (accent ≤ 10% of the screen), motion amplitude cap, hue cap. What is deleted, and why. |
| bold / epic | Scale: display size, hero area share, light–dark contrast. |
| playful | Radius, illustration language, motion overshoot, copy voice — each with a value. |
| modern | Delete it. It decides nothing. |
| make it pop | Which single element becomes the hero, and what gets quieter to let it. |

Motion words too: "animate on scroll" → scroll-*triggered* or scroll-*driven* ([motion](motion.md)). "Smooth page transitions" → which pattern (crossfade, shared element, mask). "Depth" → layered parallax with named layers.

Words you can't translate into a visible decision get deleted from the rationale.

## 3. Engines

Start each direction from a concrete engine, never an adjective. Different directions should use different engines. Each engine's content comes from evidence about *this* product.

- **material × setting** — one material in one place (anodized aluminum in a cold lab; newsprint in a café). Gives light, depth, edges, motion damping.
- **scene** — a time, place and light (4:12 a.m., wet forest, a recordist's amber meters). Gives texture and tempo. Great for mood tools.
- **character** — the product as a specific person (a meticulous archivist, a loud gym coach). Decides type and movement.
- **movement** — a design movement or cultural grammar with a *real* link to the subject or audience. Borrow its grammar, not its motifs.
- **medium** — another medium's complete way of expressing things (tape logs, survey maps, subway signage, liner notes). Borrow one or two of its most recognizable moves; the page stays a page. Don't import its props one by one.
- **rule-breaking** — radical asymmetry, dissonant pairings, uncomfortable whitespace — still beautiful and fully functional.

The engine decides structure, feel, texture and motion. Color is decided separately.

## 4. Color

Sources in order: the brand's assets, the product's physical object or content, then the audience. Don't take the engine's material color as the primary (brass, wood, darkroom red) — that's how different products end up in the same palette.

1. Write two shared lines: the category's lazy default palette (bg + accent), and which hue/value each benchmark owns.
2. Give each direction its own hue family and value structure — or explicit black & white — with one sentence on where it comes from. Avoid benchmark palettes. At least one direction leaves the category default.
3. Only three inputs go on the card: `bg`, `ink`, `accent` (+ optional `extra`). The token generator derives surfaces, lines, text tiers, accent-soft, hover and focus in OKLab and guarantees text contrast. Override a derived token in `tokens` only with a reason.

Grayscale + one accent, or no color at all, is a complete identity; color then comes from the content (photos, product shots, a painting). **Don't split directions by lightness**: "one light, one dark, one warm" is the #1 failure. Each needs its own hue family or material; lightness is a consequence.

## 5. Skeleton

Decide the skeleton before writing copy; copy fits the skeleton. First ask: **what does the user come to the first screen to see or do?**

- **To be told, shown or persuaded** (landing, brand, launch, exhibition) → choose from the persuasion skeletons in [layout](layout.md). Leave the left-text/right-image template.
- **To browse, pick or work** (gallery, store, feed, docs, portfolio, tool, dashboard) → the first screen *is* the first row of content or the workspace. Nav + title + filters ≤ two lines. The first row of content fully visible. No slogan, no "this page lets you…" paragraph. Detail and logs open on demand from a selected object.
- **Both** → go with what users most often come to do. A promo banner may stay but can't push the first row below the fold.

## 6. Direction card

One `<id>.direction.json` per direction, schema in [templates/direction.json](../templates/direction.json). In the three-first-screens round, `tone` and `benchmark` may be shared; each direction fills `northStar`, `engine`, `skeleton`, `type`, `color`, `hero`, `icons`, `controls`. Fill `structure`, `motion`, `breakthrough`, `memorable` and `refuses` after a direction is chosen, before the full build.

| Field | Precision required |
| --- | --- |
| northStar | One sentence that settles trade-offs: the first feeling, and what the page revolves around. |
| tone | Five dials with `_why`. |
| benchmark | Category, which peer was taken apart (and where the screenshots are), what's kept, what's changed, why. |
| engine | `kind`, the concrete `source`, and the `evidence` from this product. |
| skeleton | What the user sees first. Content pages: how many objects are visible, how many lines the header takes. Persuasion pages: which skeleton + a 3–5 box wireframe (what, how big, where reading starts). |
| structure | Below the fold: e.g. single immersive column; or nav / list / detail. |
| type | Families and weights for display, body, mono; the ratio (or let the dials set it). |
| color | `bg`, `ink`, `accent`, `extra`, and `from`. |
| hero | Which image or graphic carries emotion and recognition; reused, generated, or typographic. |
| icons | Which set, stroke width and caps — or none, using characters and numerals. |
| controls | One sentence for buttons, inputs, selection, tags, states: radius, stroke, pressed behavior. |
| motion | Feel as *an onomatopoeia + a physical action from the product's domain* ("clack — a cassette door closing"). Then entrance, action response, and how they echo. |
| breakthrough | The one structural departure and how it amplifies the north star. Hand-drawn notes and textured buttons don't count. |
| memorable | Where effort concentrates (see below). |
| refuses | Common moves this direction deliberately doesn't make. |
| traits | 3 short labels for the canvas. |

## 7. Divergence test

Run after the cards, before building; `canvas.mjs` also flags pairs that share two or more of display font, color family, engine and tone.

- **Compare wireframes, not descriptions.** Descriptions differ easily; wireframes all turn out "big title left, small block right". Same wireframe = same skeleton → pick another.
- **At most one of four in common.** Of skeleton, type, color and hero, any two directions share at most one. Otherwise rewrite one from a different engine.
- **Not split by lightness** (see Color).
- **At least one goes all the way.** Within the evidence's range, at least one direction commits on layout, color and hero. At most one is a compromise.
- **At least one breaks the category cliché** without abandoning the baseline. Common clichés:
  - Dashboard: left sidebar, top bar, card grid.
  - E-commerce: big banner, product grid, footer.
  - Social: bottom tabs, feed, floating action button.
  - Landing page: hero, three features, testimonials, CTA.
  - Chat: contacts left, messages right.
  - AI / dev tools: black background, purple-blue glow blobs, floating particles, identical pill buttons.
- **No clones.** Put each direction next to its benchmark.
- **Blind test.** Hide names and descriptions (canvas **Blind** mode). Can you still say how each one *feels* different?

After the first screens exist: open the canvas, turn on **Squint**. If two blur into the same light/dark masses (both "big block left, small block right"), go back to the skeleton. Don't patch with decoration.

## North star and echo

Turn the north star into page-wide relationships: who's the hero on each screen, how secondary information steps back, which typographic or graphic motif repeats to create rhythm, where one contrast marks the primary action.

A breakthrough changes structure (skeleton, proportion, reading order), not decoration; it either strengthens the theme or pulls toward the key action. When polishing, don't sand off the distinctive choices. If a new element doesn't strengthen the same intent, don't add it.

## The memorable moment

Pick one or two places per direction and spend there; keep everything else quiet. Usually it's one component's one action, with result, material, light, feel and timing all right.

Where to look:

- **Actions users take** — tap, drag, toggle, submit. More memorable than scrolling.
- **Peak moments** — payment success, first task done, level up, delete, upload, waiting for a result.
- **Edges** — 404, empty states, loading, footer. Nobody expects them, low risk.
- **AI working** — make the process visible; "in progress" vs "done" should show in the content, not just a spinner.

How to think:

- **Make the result happen in place.** A toggle shouldn't just swap an icon; the thing it affects should visibly change.
- **Draw numbers as quantities.** Percentages, durations, balances → area, length, count.
- **Deliver results with the domain's real objects** — the track, the layer, the parcel, the invoice. Receipts, cassettes, printers and retro consoles are overused; skip them unless they're the product.
- **Give controls physics and character** — weight, elasticity, reluctant overscroll.
- **Every rendering style needs a source.** Dot matrix, ASCII, pixel, particles: only if you can say where it comes from in the product; then use it from hero to loading to empty state.

## Using references

Say what a reference is for: borrowing its visual relationships, setting a quality floor, or exact recreation. Look at it before describing it. When borrowing, take relationships ("title heaviest, image carries mood, metadata very quiet") and re-compose with your content. Don't copy business modules, logos or copy. A borrowed metaphor becomes concrete UI decisions, not a skeuomorphic shell that gets in the way.

What a reference *doesn't* have is also a decision: if its first screen has no title block or explanatory paragraph, don't add one.

Choose a first screen that exposes the direction's strengths and weaknesses — a product with complex forms can't be judged by its cover. Pages that sell a product must show what the product actually delivers: a generated report, an exported contract, real processed data.

Recommendations compare task fit, distinctiveness, content capacity, legibility and implementation cost. When asking for taste: what feeling do they want, what don't they want and why, what must stay. If they only say "more premium", translate with the table above or show two variants.
