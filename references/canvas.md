# Canvas

The canvas puts candidates side by side so the user can choose. Its shell is deliberately neutral (system font, grays) so it never biases the choice or leaks into the designs.

Candidates share the same core content, main action and audience. What varies: skeleton, how information is organized, type personality, color relationships, density, and how imagery is used. Show as many as genuinely differ — usually three — never padding.

## Round folder

```
.canvas-ui/<task>/r1/
  content.js            shared copy and data (written once)
  a.direction.json      direction cards
  a.tokens.css          generated: node <skill>/scripts/tokens.mjs .
  a.html                one first screen per direction, built on its tokens
  b.direction.json …
  manifest.json         optional: title, round, question, order, extra candidates
  canvas.html           generated: node <skill>/scripts/canvas.mjs .
  shots/                generated: node <skill>/scripts/shoot.mjs . --sheet --squint --out shots
```

Without a manifest, every `*.html` in the folder is a candidate (except `canvas.html` and `*.specimen.html`), paired with `<stem>.direction.json`.

## Building candidates

- One self-contained first screen per direction at one viewport, default state only.
- `<link rel="stylesheet" href="a.tokens.css">` and use the variables (`--bg`, `--ink`, `--accent`, `--step-*`, `--space-*`, `--radius*` …) for everything themeable. That's what makes **Tune** work.
- Structure and CSS are written separately per direction. Never generate three directions from one template with three themes — they'd share a skeleton by construction.
- Relative assets work (the canvas inlines each page as `srcdoc`, which inherits the canvas's base URL).
- Scripts may draw into `<canvas>`; read colors from the CSS variables at draw time. Note that Tune doesn't redraw canvases.

## manifest.json

```json
{
  "title": "Fieldnote — sound library",
  "round": "r1",
  "question": "Which direction should we build out? Note what to keep from the others.",
  "viewport": "desktop",
  "candidates": [
    { "source": "a.html" },
    { "source": "b.html" },
    { "source": "current.png", "name": "Current site", "baseline": true },
    { "kind": "url", "url": "http://localhost:5173/", "name": "Branch preview", "nativeViewport": "1280x800" }
  ]
}
```

| Situation | Add to the candidate |
| --- | --- |
| Fixed-size UI (watch face, kiosk, slide) | `"nativeViewport": "WxH"` (or at top level) — enables the **Native** viewport |
| A prototype the user should click | `"interactive": true` (frames stay live in the grid) |
| Running dev server | `"kind": "url"`, `"url"` (the server must keep running while the user reviews) |
| Redesigning an existing page | Include the current page with `"baseline": true` |
| Only a screenshot exists | `"source": "x.png"` (kind `image` is inferred) |

Name, concept, typography, palette, traits, skeleton and hero come from the direction card; override any of them per candidate.

## Build and open

```
node <skill>/scripts/canvas.mjs <round-dir>               # writes <round-dir>/canvas.html
node <skill>/scripts/canvas.mjs <round-dir> --open        # and opens it
node <skill>/scripts/canvas.mjs <round-dir> --serve 4817  # http server for agent browser panes
```

It always rebuilds; re-run after changing candidates. The builder reports missing files, missing direction cards, and pairs of directions that are probably variants (sharing two or more of display font, color family, engine, tone).

If the host's browser can't open `file://` pages, use `--serve` (run it in the background) and open the printed URL.

## What the user can do

| Feature | Why it matters |
| --- | --- |
| **Grid / Focus / A/B / Overlay** | Survey, inspect at 100%, compare two with synced scroll, or onion-skin one over another (baseline vs redesign, reference vs recreation). |
| **Desktop / Tablet / Mobile / Native** | Same candidates at each viewport. First screens are built for one viewport; the others are a preview of risk, not a promise. |
| **Squint** | Blur + grayscale: compares light/dark masses. Same masses = same skeleton. |
| **Blind** | Hides names and rationale and shuffles order. The user judges pictures, not pitches. |
| **Keep / Change notes** | Per candidate; notes on *other* candidates become "Borrow from…" and "Avoid…" lines in the pick. |
| **Tune** (Focus view, `U`) | Live sliders for the five dials, type ratio, and bg/ink/accent. Re-derives every token in the page with the same engine as `tokens.mjs`. |
| **Pick** | Copies a paste-ready instruction and offers a `decision.json` download. |

Keyboard: `←/→`, `1–9`, `G F C O`, `D T M N`, `S`, `B`, `U`, `Enter`, `Esc`, `?`. State persists per round in the browser's local storage.

## Reading a pick

The user pastes something like:

```
[canvas-ui] Fieldnote — sound library · round r1
Pick: 03 "Survey" (c.html)
Keep: Map-first navigation, magenta pins
Borrow from 01 "Contact Sheet": the docked waveform player
Avoid (seen in 02): the dark full-bleed hero
Token overrides for 03: tone.formality 30→90; color.accent #c8235f→#1f7a5c
```

1. Check the title and round match the current manifest. If not, ask which round they mean.
2. Apply token overrides to `c.direction.json` (that's the source of truth) and re-run `tokens.mjs`.
3. Record pick, keep, change, borrow and avoid in the design brief.
4. Continue at step 2 of SKILL.md with the picked direction. If they asked to merge two directions, build the merged first screen and confirm it before the full build.

The canvas never writes files and never messages the agent by itself.

## Check before sending

`node <skill>/scripts/shoot.mjs <round-dir> --sheet --squint --out <round-dir>/shots`, then look at `sheet.png` and `squint.png`:

- each capture matches the intended page, state and viewport;
- web fonts actually rendered (no fallback serif);
- no lint `fix` items; no console errors;
- squint masses differ between candidates.

Judge type size and detail in Focus at 100%, not in the fitted thumbnails. The canvas itself is covered by the skill's tests — don't re-test or read its source during a task.
