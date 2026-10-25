---
name: canvas-ui
description: "Design, redesign, and review interfaces (websites, apps, dashboards, components) with taste: explore 3 genuinely different directions, compare them side by side on a live canvas, tune them with design tokens, then refine against real screenshots until they hold up. Use when the user wants a new UI, a visual redesign, design directions to choose from, a screenshot recreation, or a UI/UX review. Do NOT use for pure business logic, API work, refactors with no visual change, or fully specified micro-edits (change this copy, make this button green)."
license: MIT
metadata:
  version: "0.1.0"
  compatibility: "Host-neutral: plain-text workflow for Claude Code, Codex, Gemini CLI, Cursor, OpenCode, DeepSeek and other agents. Bundled tools need Node 20+ and a Chrome/Chromium/Edge install; nothing else. Visual checks need an agent that can view images; when it cannot, say so instead of claiming visual quality."
---

# canvas-ui

Pick one sentence the design must serve (the **north star**), then make layout, type, color, imagery and motion all pull toward it. Taste is choosing the strongest few things and deleting the rest — not sanding every direction down to the same safe beige. Judge _does it look right_ and _does the task work_ separately, and judge both on real screenshots, never on the code you just wrote.

Everything you need is in this folder. Relative links resolve from this file. `<skill>` below means this folder's absolute path. Tool usage: [tools](references/tools.md). Follow the project's own frontend conventions for implementation.

## 0. Scope the request

Read only what you need: who the user is, the one main task, the real content, the target device, and what to deliver (direction notes, comparison canvas, static mockup, or working UI). Reply in the user's language.

| Request                                                                                        | Path                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Micro-edit** — the element and the change are named ("save button green", "more space here") | Just do it. If color/spacing/style changed, glance at the changed area in the target viewport. No directions, no review.                                                                                                                               |
| **New UI** or "explore / give me options"                                                      | Steps 1 → 5.                                                                                                                                                                                                                                           |
| **Continue a chosen direction**                                                                | Start at step 2; only re-check affected areas.                                                                                                                                                                                                         |
| **One component, make it exceptional**                                                         | Steps 1 → 5 with one direction: one visual hero, color pulled from it, all effort on the key interaction moment.                                                                                                                                       |
| **Existing product: refresh / new flow / new feature**                                         | Decide which. A _refresh_ may change accidental defaults but keeps brand assets. A _flow or feature_ keeps the existing visual language — skip direction exploration, reuse tokens and components, fix at the source. Take baseline screenshots first. |
| **Recreate from screenshot**                                                                   | Reference image is the spec. Match its viewport, go to step 2, compare every round with `shoot.mjs --compare`. No new style.                                                                                                                           |
| **Review only**                                                                                | Step 4, diagnosis only. Do not edit files.                                                                                                                                                                                                             |

Ask **once**, only when a missing answer would change the core direction and you can't infer it. Decide everything reversible yourself and state the assumption.

Process files go in the workspace (default `.canvas-ui/<task>/`, see [workspace](references/workspace.md)); real deliverables go in the user's project.

## 1. Explore directions

Read [direction](references/direction.md) now (and nothing from steps 2–5 yet).

1. **Name the category and its 2–3 most distinctive peers.** Look at real screenshots of them when you can browse; write 6–10 concrete, copyable observations of one ("48px pill CTA, 600 weight, 2px inset ring on focus — because…"). Decide what to keep (the user's expectations) and what to change.
2. **Set the tone** on five dials (energy, finish, density, weight, formality), each with evidence from the product. Translate vague words ("premium", "clean") into decisions.
3. **Write three direction cards** as `direction.json` files ([schema](templates/direction.json)). Each starts from a different _engine_ (material × setting, a scene, a character, a design movement, another medium's grammar, deliberate rule-breaking) and passes the **divergence test**: of skeleton, type, color and hero visual, any two directions share at most one.

**Ask in words first.** Send the user the three directions as 3–4 lines each (feel, first-screen skeleton, type + color, hero), your recommendation with a reason, and ask: build one, or render all three on the canvas to compare? End the turn.

- They pick one, or their description already decides it → build only that one. Run the divergence test against the benchmark once so it doesn't clone a peer.
- They want to see them → build three **first screens** (below).
- They said "you decide", "just build it", or you're running unattended → build the three first screens anyway, look at them side by side at thumbnail size, pick one, write down why, continue.
- They supplied brand guidelines or a firm reference → the style is fixed; the three directions differ only in skeleton, hero and page structure.

**Building first screens for the canvas** — see [canvas](references/canvas.md):

- One HTML file per direction, one viewport, first screen only, default state only. No interactions, no responsiveness, no motion. Write them in parallel if your host supports subagents.
- Shared copy and data, written once. Separate structure and CSS for each — never one template re-skinned three ways.
- Generate tokens per direction: `node <skill>/scripts/tokens.mjs <dir>/a.direction.json` → `a.tokens.css`. Build on those variables so the canvas **Tune** panel works.
- Placeholders for imagery are flat blocks sampled from the palette, not stock gradients. If a direction lives or dies by an image, make one (and at most one retry).
- Build the canvas: `node <skill>/scripts/canvas.mjs <dir>`. Screenshot it once (`node <skill>/scripts/shoot.mjs <dir> --sheet --squint --out <dir>/shots`), look at `sheet.png` and `squint.png`, fix overlap/clipping/obvious roughness. If two squint blocks look alike, change the skeleton — not the colors.
- Send the canvas path, your recommendation, and ask the user to **Pick** (the canvas copies a ready-to-paste instruction with their notes and token tweaks).

When the user pastes a canvas pick, match the round and number against the manifest, record the choice, likes/dislikes and any token overrides in the design brief, and apply the overrides to that direction's `direction.json` before step 2.

Keep a short **design brief** in the workspace: user, main action, chosen direction, key states, device constraints, acceptance criteria. Update it; don't fork it.

## 2. Build the structure

Once a direction is chosen, read by page type: **persuasion pages** (landing, brand, launch, exhibit) → [visual language](references/visual-language.md), [layout](references/layout.md), [motion](references/motion.md). **Product UI** (tool, dashboard, app, store, feed) → [visual language](references/visual-language.md), [layout](references/layout.md), [motion](references/motion.md) §basics.

- Settle the skeleton before writing copy; copy fits the skeleton.
- Content pages: the first screen _is_ the content or workspace. No slogan, no "what this page does" paragraph.
- Pick or make the key visual first and compose around it. Don't fill a layout and add an image last.
- Build the real hierarchy and the main flow, not just a pretty default state: empty, loading, error, success for the primary action.
- Three baseline motions for any new UI or changed flow: entrance of the primary content, response to the primary action, and the state change it causes — and make them echo each other.
- Existing projects: reuse working tokens and components. Don't invent a design system for one tweak or mix refactors into visual work.

## 3. Build, then get evidence

- Finish the most representative screen or the main flow first, check it, then spread.
- Real-looking content. Mock data, generated images and unwired actions go in the delivery notes — never on screen ("sample", "placeholder", "not connected"). Never fake testimonials, customer logos or metrics.
- Look at the target viewport. While iterating: one screenshot of the current screen after a _batch_ of changes. Before review and before delivery: full evidence — `node <skill>/scripts/shoot.mjs <target> --size desktop,mobile --full --lint`.
- Every shot runs the **design lint** ([slop](references/slop.md)). `fix` items are mandatory (contrast, tiny text, tight leading, overflow, clipped text). `tell` items (AI-default tells) must be removed or justified in the delivery notes.
- Check long headings and body copy wrapping at the narrowest width. Fix overflow with content and layout, never by shrinking text. A saved screenshot is not a viewed screenshot.

## 4. Review independently

Follow [review](references/review.md).

| Change                                        | Review                                                                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Direction canvas                              | User decides. No reviewer unless asked.                                                                                   |
| New UI / redesign after a direction is chosen | Fresh-context visual reviewer once the first version is stable. Score /10 on the rubric; fix until ≥ 8 or report the gap. |
| Polishing an existing screen, or review-only  | One rubric pass, no score, issues by severity.                                                                            |
| Micro-edit                                    | Look yourself.                                                                                                            |

When the page has a real flow, also run a **blind UX walkthrough**: a fresh subagent gets only the URL/file and the viewport — not the intended path — infers the goal, and walks it. If the host has no isolated image-capable subagent, self-review and say it was not independently reviewed.

If the style starts drifting during fixes, keep the best version and explain the trade-off.

## 5. Verify and deliver

Depth follows the change: micro-edits check the changed area; polish does before/after; new UI does everything below.

- Walk every interaction from its real entry point to an observable result. Anything that saves: verify reload-and-read-back and the failure path.
- Run the project's typecheck and lint only. Not production builds or full test suites unless asked. Note environment problems unrelated to the UI in one line and move on.
- **Subtraction pass**: one hero per screen, everything else quiet. Delete repeated or explanatory copy that doesn't change understanding. Keep object names, the basis for decisions, current state and the primary action.
- Check key areas at 100% and 200% zoom.
- Remove workspace files and references from the real deliverable ([workspace](references/workspace.md)).

Delivery notes cover: chosen direction and why · what changed, what didn't and why · motions added · review rounds and scores (or "not reviewed") · copy removed · lint `tell` items kept and why · where the evidence lives.

## Limits

Can't view images → write "visual result not verified" and give no visual score. No runnable environment → never claim interactions pass. Can't generate images → use suitable existing material or a palette-sampled placeholder plus an asset brief. Use only services the task authorizes; never sign up for paid services.

## Extensions

If a `canvas-ui-pro` folder sits next to this one (or `CANVAS_UI_PRO` points to one), read its `SKILL.md` after this file: it adds references and overrides steps by name. Nothing here depends on it.
