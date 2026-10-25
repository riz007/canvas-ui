# Motion

## Basics: three motions for every new UI

1. **Entrance** of the primary content (first visit only; don't replay on re-render or state restore).
2. **Response** to the primary action (press, submit, play, add).
3. **Consequence** — the state change that action causes (the list updates, the item lands, the total counts up).

Make them **echo**: the same shape, direction or color travels from one to the next (the play dot that lights in the row is the same dot that marks downloaded clips). Echo makes a UI feel designed instead of decorated.

## Feel

Describe feel as *an onomatopoeia + a physical action from the product's domain*, then map it to a spring or curve:

| Feel | Physical reference | Spring (stiffness / damping) | Use for |
| --- | --- | --- | --- |
| click | magnet snapping, a latch | 350–400 / 10–15 | buttons, toggles, menus |
| glide | soft-close drawer | 250–300 / 20–25 | sheets, drawers, accordions |
| pour | honey, mist | 150–200 / 30–40 | page transitions, hero reveal |
| thud | a weight set on a table | 400–500 / 5–10 | confirming a choice, completion |
| bounce | rubber ball | 300 / 8 | celebration, kids, games |
| drift | helium balloon | 100 / 25 | ambient loops, calm apps |

Tokens give you `--dur-1/2/3`, `--ease-out` and `--ease-spring` derived from `energy`. Use them for CSS transitions; use a spring library only when motion follows the pointer or is interrupted often.

## Durations

| What | Duration | Notes |
| --- | --- | --- |
| press, toggle, select | 120–200ms | Press applies instantly (~80ms), scale 0.96–0.98; release springs back |
| dropdown, popover, tooltip | 180–250ms | Grow from the trigger; start at ~0.96 scale, never from 0 |
| panel, drawer, sidebar | 250–400ms | Longer for longer travel |
| view / page change | 350–500ms | Over 500ms feels like waiting |
| staggered entrance | 30–80ms between items | Total ≤ 600ms; only the first screenful |

## Picking a technique

| Need | Use |
| --- | --- |
| State changes (press, focus, expand) | CSS transitions, or the component library's own |
| Elements changing place between views | View Transitions API / shared-element transition |
| Drag, gestures, layout animation, choreography | The project's motion library (Motion, GSAP, Framer Motion, Reanimated…) |
| Brand moments, materials, physics | Canvas/WebGL, Lottie/Rive, or pre-rendered video |
| Progress tied to scroll or pointer | Scroll-driven animation (CSS `animation-timeline` or the library's scroll API); must handle reverse and fast scrolling |

### Scroll: triggered vs driven

- **Triggered**: crossing a threshold plays an animation once (sections fade/slide in). Default for "animate on scroll". Animate `opacity` and `transform` only, 8–24px travel, once.
- **Driven**: progress maps directly to scroll position (pinned sections, parallax layers, a product that rotates as you scroll). Use for at most one or two narrative moments on a persuasion page. Must reverse cleanly and never trap the scroll.

Persuasion pages (landing, brand, launch, exhibition) should have section entrances and at least one scroll-driven story beat. Product UI generally shouldn't.

## Say what's invisible

If an action has an effect the user can't see (saved to cloud, sent, queued), show it: a short confirmation in place, a count that changes, an item that moves to where it now lives. Toasts are the last resort, not the default.

## Performance and accessibility

- Animate `transform` and `opacity`. Avoid animating layout properties on large trees.
- Honor `prefers-reduced-motion`: replace movement with fades or instant changes; keep feedback.
- Never block input on an animation. Interruptions must retarget, not queue.
- Nothing important should depend on hover alone.

## Checking motion

Screenshots can't show motion. Use `shoot.mjs --steps "click .play" --frames 8 --interval 60` to get a strip of frames, and look at it: does the motion start where the user acted, and land where the result lives? Are there frames where content is invisible or overlapping? Watch real-time once in a browser too.
