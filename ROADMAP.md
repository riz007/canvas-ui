# Roadmap

The open-source core takes a new UI from a blank page to a well-directed, verified design. Pro will plug in through the extension hook in `SKILL.md` (a `canvas-ui-pro` folder next to the skill, or `CANVAS_UI_PRO`), adding references and overriding steps by name, so the core never depends on it.

## Core (open source) — next

- [ ] Dark-mode pair generation from one card (`tokens.mjs --dark`)
- [ ] `shoot.mjs --record` (MP4/WebM via the browser's screencast, no ffmpeg)
- [ ] Canvas: side-by-side token diff between two candidates
- [ ] Canvas: comment pins on a frame (click to drop a numbered note → included in the pick)
- [ ] `tokens.mjs --export tailwind|figma|style-dictionary`
- [ ] Layout round helper: derive skeleton variants from a chosen card
- [ ] More examples: dashboard, mobile app, checkout flow, landing page

## Pro — candidates

Grouped by the gap they close. Ordering and packaging to be decided.

**Usability depth**
- Interaction & state patterns: forms, validation, dialogs, popovers, toasts, empty/loading/error, undo
- Responsive playbook: per-pattern desktop ↔ mobile transformations
- Accessibility pass: focus order, landmarks, screen-reader labels, reduced motion, verified with the browser's accessibility tree

**Dashboards and tools**
- Workspace layouts chosen per product type, with one style across dense screens
- Data-viz grammar tied to the tokens (chart palettes derived from the direction)

**Existing products**
- Separate playbooks for a visual refresh, a flow fix, and a new feature inside an existing design system
- Design-system extraction: read a live site or repo → direction card + tokens
- Before/after canvas with baseline screenshots captured automatically

**Quality bar**
- Multi-round review aiming for 9/10, with a reviewer that checks direction overlap and AI-default drift between rounds
- Detail checklist (optical alignment, icon weights, numeric alignment, text rag)
- Visual regression: `shoot.mjs --baseline` + per-region diffs in CI

**Craft library**
- Component prototypes with spatial expansion (card → sheet → page)
- Effects with tokens: light trails, dot fields, flowing gradients, shader backgrounds, all with reduced-motion fallbacks
- Motion presets mapped from the "feel" vocabulary to springs for Motion/GSAP/Reanimated

**Collaboration**
- Shared canvas: hosted picks and comments from several reviewers, merged into one instruction
- Figma round-trip: export candidates as frames, import comments
