# Layout and viewport

## Persuasion skeletons

For landing, brand, launch and exhibition pages. The model's most stubborn habit is the left/right split, and it gets decided before any copy is written: headline, paragraph, button, image on the right. So pick the skeleton **first**, then sketch it as 3–5 boxes (what each is, how much of the screen it takes, where reading starts).

| Skeleton | First screen |
| --- | --- |
| **Full-bleed image** | One image fills the screen; title and action sit in its safe area. |
| **Single object** | One object or sentence, centered, surrounded by a lot of space. |
| **The product is the page** | The first screen *is* the interface or the physical object; title, nav and actions grow out of it. |
| **Type as image** | Type so large it is the picture — crossing edges, cropped. |
| **Full-width stack** | A full-width headline spans the page; content follows immediately below. |
| **Grid / collage** | Several things at once on a grid or collage; no single hero. |
| **Vertical / diagonal** | Vertical, slanted or rotated type that breaks left-to-right reading. |
| **Split** | Text one side, visual the other. The model's default: at most **one** direction per round, with a written reason. The visual side needs a real hero (an image that breaks the frame, a graphic device, a zoomed product close-up) — not a shrunken full-page screenshot. |

Rules: directions in one round use different skeletons. "Headline 9 columns, paragraph 3 columns" is still a split. Tone sets the volume, skeleton sets the structure — a quiet product can still put one sentence in the middle of an empty screen.

## Workspace layouts

For tools, dashboards, stores, feeds. Choose by the user's most frequent action, not by the category template:

| Main action | Layout that fits |
| --- | --- |
| Scan many similar objects | Dense list/table, filters in one row, detail as slide-over |
| Compare a few objects | Side-by-side columns, aligned rows |
| Work on one object | Canvas/editor center, tools at the edge, properties on demand |
| Find by place / time / relation | Map, timeline or graph as the primary navigation |
| Monitor | Few large numbers drawn as quantities, exceptions surfaced first |
| Browse for pleasure | Media-first grid or single column, chrome minimal |

The default "left sidebar + top bar + card grid" is a cliché; use it only when navigation really is deep and the content really is cards. Keep the main area quiet; put full detail and logs behind selection, not on the canvas.

## Viewports

- Name the target viewport(s) up front. Defaults: desktop 1440×900, mobile 390×844 (`shoot.mjs --size desktop,mobile`).
- Design the first screen for the real fold: what's visible at 1440×900 *and* at 1280×720 (laptop with browser chrome).
- Mobile isn't the desktop squeezed: reconsider what's first, move secondary panels behind a tap, make primary actions thumb-reachable, inputs ≥ 16px.
- Fluid type comes from the tokens (steps ≥ 3 clamp with viewport). Don't add breakpoint-specific font sizes unless needed.
- Test the narrowest width for long words, long names and translated strings.
- No horizontal scrolling at any target width (lint `fix`).

## Exact recreation

When the user gives a screenshot and wants it rebuilt:

1. Find the reference's logical size (screenshot px ÷ device scale). Capture at that size: `--size 1280x800`.
2. Build the structure first (grid, columns, major blocks), then type (family, size, line height), then color, then detail.
3. Every round: `node <skill>/scripts/shoot.mjs page.html --compare ref.png --size WxH`. Read `diff.png` (reference | diff | yours). Fix the biggest red areas first; a low mismatch % with a misplaced block is still wrong.
4. Use the canvas **Overlay** view (reference image as one candidate, your page as another) for onion-skin checks.
5. Don't "improve" a recreation. Report anything you couldn't match (licensed fonts, missing images) instead.
