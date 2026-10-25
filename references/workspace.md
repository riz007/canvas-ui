# Workspace

Process files (direction cards, candidate screens, canvases, screenshots, review notes) live in a workspace; real deliverables live in the user's project.

## Where

1. If the project or user names a place, use it.
2. Otherwise `.canvas-ui/<task>/` at the project root, where `<task>` is a short kebab-case name (`checkout-redesign`, `fieldnote-landing`).
3. Not in a project (empty folder, a chat-only host)? Use the current folder's `.canvas-ui/<task>/`.

Never write into the skill's own folder.

```
.canvas-ui/<task>/
  brief.md            the design brief (one, kept current)
  refs/               benchmark screenshots and user-supplied references
  r1/                 direction round: cards, tokens, first screens, canvas, shots/
  r2/                 layout round, if any
  build/              prototype screens before they move into the project (if needed)
  evidence/           screenshots and report.json used for review and delivery
  review/             reviewer reports, one file per round
```

Suggest adding `.canvas-ui/` to `.gitignore` the first time you create it in a git repo (ask; don't edit `.gitignore` silently).

## Brief

`brief.md` stays short and current:

```
# <task>
User: …                     Main action: …
Devices: desktop 1440, mobile 390
Direction: r1/03 "Survey" — picked <date>; keep …; change …; token overrides applied
Key states: empty · results · playing · error
Acceptance: …
Open questions: …
```

## Delivery hygiene

Before delivering:

- Nothing in the real deliverable imports from `.canvas-ui/` (grep for it).
- Production assets (images, fonts, generated media) are copied into the project's real asset folder, optimized, with sources recorded if licenses require attribution.
- Tokens used in production live in the project's stylesheet or theme, not in a workspace `tokens.css`.
- The workspace stays (it's the design history) unless the user asks to remove it.
