# Review

Two kinds, run by someone who didn't build it: a **visual review** (does it look right, against the direction) and a **blind UX walkthrough** (can someone who doesn't know the plan get the job done). The builder then fixes; the reviewer never edits.

## Dispatching a reviewer

Use a fresh subagent with no history (Claude Code `Agent`/`Task`, Codex sub-agent, Gemini sub-agent, or a new chat). It must be able to view images. Hand over only:

- the screenshots (paths), viewports, and which state each shows;
- the north star, the chosen direction's card, and the brief's acceptance criteria;
- the lint report (`report.json`);
- this file's rubric section, and the instruction: *"Review only. Don't edit files. Don't read source code."*

Don't hand over: your reasoning, the build history, the code, or what you think is wrong. If no isolated image-capable subagent exists, review yourself using the rubric and write "self-reviewed, not independent" in the delivery notes.

Reuse evidence from the last round for anything unchanged; say which files are reused. When a shared style changed, re-capture everything it touches.

## Rubric (new UI and redesigns) — score /10

The reviewer scores each line 0–2, then sums. Below 8: fix and re-review (max 3 rounds; then report the gap honestly).

| Criterion | 2 = | 0 = |
| --- | --- | --- |
| **Direction** | Unmistakably the chosen direction; the north star is visible in the first screen | Generic; could be any product |
| **Hierarchy** | One hero per screen; scanning order is obvious | Competing emphasis; eye doesn't know where to land |
| **Type & color** | Distinct, consistent pairing; accent used with discipline; all text legible | Default fonts, accent everywhere, legibility `fix` items |
| **Craft** | Spacing on scale, aligned edges, consistent control grammar, states present, no lint `fix` | Misalignments, mixed radii, clipped or overlapping text |
| **Specificity** | Real-looking content; at least one memorable, product-specific moment; tells removed or justified | Placeholder content, template sections, unjustified tells |

Report format:

```
Score: 7/10 (Direction 2 · Hierarchy 1 · Type & color 2 · Craft 1 · Specificity 1)
Must fix
1. [screen/state] what's wrong → what to do (evidence: file + area)
Should fix
…
Keep (don't lose these when fixing)
…
```

Every issue cites a screenshot and an area. "Feels off" is not an issue; "the price and the CTA have equal weight in mobile.png, top-right" is.

## Polish review (existing UI, or review-only requests)

One pass, no score. Check against the project's own conventions first, then the rubric's Hierarchy and Craft lines, then lint. Output issues by severity with evidence and a concrete change. If the user asked for review only, deliver exactly this and change nothing.

## Blind UX walkthrough

For any page with a real flow. A fresh subagent gets:

- the URL or file and the viewport;
- the ability to click, type and take screenshots (host browser tools or `shoot.mjs --steps`);
- **not** the intended path, the user story, or the expected result.

Instruction: *"Work out what this page is for. Then do the main thing it's for, start to finish, as a first-time user. Report: what you thought it was for, each step you took with a screenshot, where you hesitated or got it wrong, and anything that broke. Don't read source code."*

Compare its inferred goal to the real one. Mismatch = the first screen isn't saying what it's for. Hesitations = labels, affordances or feedback to fix. After fixes, the builder verifies the path; a second walkthrough isn't required.

## Capturing evidence

```
node <skill>/scripts/shoot.mjs <target> --size desktop,mobile --full --out .canvas-ui/<task>/evidence
node <skill>/scripts/shoot.mjs <target> --steps "open: click .cta; done: click .confirm" --size mobile
node <skill>/scripts/shoot.mjs <target> --scale 2 --selector ".checkout" --out .canvas-ui/<task>/evidence/detail
node <skill>/scripts/shoot.mjs <target> --steps "click .play" --frames 8 --interval 60
```

Check the evidence before handing it over: default state fully loaded, fonts rendered, the state named is the state shown, no empty WebGL frames.
