# Tools

All tools are plain Node scripts with **no npm dependencies**. Requirements: Node 20+ (22+ recommended; on 20 add `--experimental-websocket` for `shoot.mjs`) and Chrome, Chromium, Edge or Brave (or set `CHROME_PATH`). In containers where Chrome can't create its sandbox, set `CANVAS_UI_NO_SANDBOX=1` (it's set automatically when `CI` is). `<skill>` is this skill's folder. Every script has `--help`; you don't need to read their source.

If the host has its own browser tools, use them for looking around and walking flows. Use `shoot.mjs` for evidence: it runs an isolated temporary browser profile, never touches the user's browser data, and adds the lint. If Node or Chrome is missing, fall back to host tools and produce the same evidence.

## tokens.mjs — direction card → CSS tokens

```
node <skill>/scripts/tokens.mjs <dir | card.json> [--specimen] [--set key=value] [--json] [--out file]
```

See [tokens](tokens.md).

## canvas.mjs — comparison canvas

```
node <skill>/scripts/canvas.mjs <dir | manifest.json | a.html b.html …> [--title] [--round] [--question] [--viewport] [--out] [--open] [--serve [port]]
```

See [canvas](canvas.md).

## shoot.mjs — screenshots, sheets, squint, diff, lint

```
node <skill>/scripts/shoot.mjs <url | file.html | dir | image> [more…] [options]
```

| Want | Add |
| --- | --- |
| Quick look at desktop | (default) `--size desktop` |
| Desktop + mobile | `--size desktop,mobile` |
| Whole page | `--full` |
| All candidates + overview | pass the round folder; add `--sheet` (and `--squint`) |
| Just one component | `--selector ".card"` |
| A state reached by interaction | `--steps "click .open; wait 300"` |
| Several named states | `--steps "open: click .menu; filled: type #q \"rain\"; done: key Enter"` |
| Detail at 200% | `--scale 2` (with `--selector` to keep it small) |
| Dark mode | `--dark` |
| A transition | `--steps "click .play" --frames 8 --interval 60` → frame strip |
| Point at problems for the user | `--mark "1=.hero h1; 2=.cta"` |
| Recreation vs reference | `--compare ref.png --size WxH` → `diff.png` + mismatch % |
| Skip the lint | `--no-lint` |

Steps: `click <css>`, `hover <css>`, `type <css> "<text>"`, `key <Key>`, `scroll <px>`, `wait <ms>`, `waitfor <css>`, `eval <js>`. Prefix with `name:` to capture that state.

Output goes to `--out` (default `.canvas-ui/shots`): PNGs, `sheet.png`, `squint.png`, `diff.png`, `report.json` (per capture: file, label, size, `lint[]`, console `errors[]`, `compare`).

### When to shoot, how much

- **Looking** while iterating: one capture of the current screen after a *batch* of edits. If nothing changed, don't re-shoot.
- **Evidence**: before review and before delivery only. Full set: each target viewport, key states, a `--full` page for long pages, `--scale 2` details for dense areas, frames for the primary motion.
- Direction round: one capture per direction plus sheet and squint. No evidence pass.

### Reading the output

Console errors (`✖ console`) are real bugs in your page unless they're from an unwired backend. Lint lines: `✖ fix` must be fixed; `? check` look at it; `◇ tell` remove or justify. Then open the images. A saved screenshot is not a viewed screenshot.

## Building interactive prototypes

Only after a direction is chosen; existing projects use their own stack.

- One entry HTML; switch states with a URL parameter (`?state=empty`) rather than duplicating pages. That also makes evidence easy: `shoot.mjs "page.html?state=empty"`.
- Link the tokens file; split CSS and JS into sibling files once the page grows.
- Keep state in one place (a small store, or Alpine.js `x-data` if you want zero build); read initial state from the URL.
- Gesture-following, physics, canvas and WebGL live in their own module; per-frame values never go through UI state.
- No build step unless the project already has one.
