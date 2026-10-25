// Pure token engine: direction card -> design tokens.
// Shared by scripts/tokens.mjs (Node) and the canvas Tune panel (inlined into the page),
// so it must stay dependency-free and DOM-free.

// ---------- color math (sRGB <-> OKLab/OKLCH, WCAG contrast) ----------

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function parseHex(hex) {
  let h = String(hex).trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(h)) throw new Error(`Not a hex color: ${hex}`);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}

export function toHex([r, g, b]) {
  return "#" + [r, g, b].map((c) => Math.round(clamp(c) * 255).toString(16).padStart(2, "0")).join("");
}

function rgbToOklab([r, g, b]) {
  [r, g, b] = [r, g, b].map(toLin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToRgbLinear([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

export function hexToOklch(hex) {
  const [L, a, b] = rgbToOklab(parseHex(hex));
  const C = Math.hypot(a, b);
  let H = (Math.atan2(b, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { l: L, c: C, h: C < 1e-4 ? 0 : H };
}

// Gamut-map by reducing chroma until the color fits sRGB.
export function oklchToHex({ l, c, h }) {
  l = clamp(l);
  let lo = 0, hi = Math.max(0, c), best = null;
  const at = (cc) => {
    const rad = (h * Math.PI) / 180;
    return oklabToRgbLinear([l, cc * Math.cos(rad), cc * Math.sin(rad)]);
  };
  const fits = (rgb) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);
  if (fits(at(hi))) best = at(hi);
  else {
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2, rgb = at(mid);
      if (fits(rgb)) { lo = mid; best = rgb; } else hi = mid;
    }
    best = best || at(0);
  }
  return toHex(best.map((v) => toGam(clamp(v))));
}

export function mix(hexA, hexB, t) {
  const A = rgbToOklab(parseHex(hexA)), B = rgbToOklab(parseHex(hexB));
  const lab = A.map((v, i) => v + (B[i] - v) * t);
  return toHex(oklabToRgbLinear(lab).map((v) => toGam(clamp(v))));
}

export function luminance(hex) {
  const [r, g, b] = parseHex(hex).map(toLin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Nudge `fg` lightness until it reaches `target` contrast on `bg` (keeps hue).
export function ensureContrast(fg, bg, target) {
  if (contrast(fg, bg) >= target) return fg;
  const o = hexToOklch(fg), darker = luminance(bg) > 0.18;
  for (let i = 1; i <= 50; i++) {
    const cand = oklchToHex({ ...o, l: clamp(o.l + (darker ? -0.02 : 0.02) * i) });
    if (contrast(cand, bg) >= target) return cand;
  }
  return darker ? "#000000" : "#ffffff";
}

// ---------- dials -> scales ----------

// Dials are 0..100. Missing dials sit at 50.
export const DIALS = {
  energy: ["quiet", "loud"],
  finish: ["raw", "refined"],
  density: ["airy", "dense"],
  weight: ["light", "heavy"],
  formality: ["playful", "formal"],
};

const lerp = (a, b, t) => a + (b - a) * t;
const round = (v, p = 3) => Math.round(v * 10 ** p) / 10 ** p;
const dial = (tone, k) => clamp((tone?.[k] ?? 50) / 100);

const DEFAULT_STACKS = {
  serif: 'ui-serif, Georgia, "Times New Roman", serif',
  sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
};

function fontStack(spec, fallback) {
  if (!spec) return DEFAULT_STACKS[fallback];
  if (typeof spec === "string") spec = { family: spec };
  const fb = DEFAULT_STACKS[spec.fallback || fallback] || DEFAULT_STACKS.sans;
  return spec.family ? `"${spec.family}", ${fb}` : fb;
}

/**
 * Build tokens from a direction card.
 * Returns { vars: {"--name": value}, report: {contrast, warnings} }.
 * Explicit `tokens` overrides on the card win over anything derived.
 */
export function buildTokens(direction) {
  const d = direction || {};
  const tone = d.tone || {};
  const energy = dial(tone, "energy"), finish = dial(tone, "finish"), density = dial(tone, "density");
  const weight = dial(tone, "weight"), formality = dial(tone, "formality");
  const color = d.color || {};
  const type = d.type || {};
  const warnings = [];

  // Color: bg, ink, accent are the only inputs; everything else is derived in OKLab.
  const bg = color.bg || "#f7f6f2";
  const ink = color.ink || (luminance(bg) > 0.18 ? "#141414" : "#f2f2ee");
  const accent = color.accent || "#2f5bea";
  const dark = luminance(bg) < 0.18;
  // Every text token passes WCAG AA by construction: ink-2 >= 6:1, ink-3 >= 4.5:1.
  const ink2 = ensureContrast(mix(ink, bg, 0.3), bg, 6);
  const ink3 = ensureContrast(mix(ink, bg, 0.48), bg, 4.5);
  const accentText = ensureContrast(accent, bg, 4.5);
  const onAccent = contrast("#ffffff", accent) >= contrast("#111111", accent) ? "#ffffff" : "#111111";
  const a = hexToOklch(accent);

  const vars = {
    "--bg": bg,
    "--surface": mix(bg, ink, dark ? 0.06 : 0.035),
    "--surface-2": mix(bg, ink, dark ? 0.11 : 0.07),
    "--line": mix(bg, ink, dark ? 0.18 : 0.12),
    "--line-strong": mix(bg, ink, dark ? 0.34 : 0.26),
    "--ink": ink,
    "--ink-2": ink2,
    "--ink-3": ink3,
    "--ink-faint": mix(ink, bg, 0.62), // non-text only: rules, disabled glyphs, decoration
    "--accent": accent,
    "--accent-text": accentText,
    "--on-accent": onAccent,
    "--accent-hover": oklchToHex({ ...a, l: clamp(a.l + (dark ? 0.06 : -0.06)) }),
    "--accent-soft": mix(bg, accent, dark ? 0.22 : 0.12),
    "--focus": oklchToHex({ ...a, l: dark ? 0.78 : 0.55, c: Math.max(a.c, 0.12) }),
  };
  for (const [k, v] of Object.entries(color.extra || {})) vars[`--${k}`] = v;

  // Type: ratio grows with energy and weight unless pinned.
  const base = type.base || Math.round(lerp(17, 15, density));
  const ratio = type.ratio || round(lerp(1.16, 1.42, energy * 0.6 + weight * 0.4), 3);
  vars["--font-display"] = fontStack(type.display, "serif");
  vars["--font-body"] = fontStack(type.body, "sans");
  vars["--font-mono"] = fontStack(type.mono, "mono");
  vars["--weight-display"] = String(type.display?.weight ?? Math.round(lerp(400, 800, weight) / 100) * 100);
  vars["--weight-body"] = String(type.body?.weight ?? 400);
  // Small steps never drop below 12px / 13px, whatever the ratio.
  const floor = { "-2": 12, "-1": 13 };
  for (let s = -2; s <= 6; s++) {
    const px = Math.max(floor[s] || 0, base * ratio ** s);
    const name = `--step-${s < 0 ? "n" + -s : s}`;
    // Fluid above step 2: shrink to ~72% on small screens.
    vars[name] = s >= 3
      ? `clamp(${round((px * 0.72) / 16)}rem, ${round((px * 0.72) / 16)}rem + ${round(((px * 0.28) / 1280) * 100, 2)}vw, ${round(px / 16)}rem)`
      : `${round(px / 16)}rem`;
  }
  vars["--leading-body"] = String(round(lerp(1.65, 1.45, density), 2));
  vars["--leading-tight"] = String(round(lerp(1.12, 0.96, energy * 0.5 + weight * 0.5), 2));
  vars["--tracking-display"] = `${round(lerp(0, -0.035, weight * 0.5 + energy * 0.5), 3)}em`;
  vars["--measure"] = `${Math.round(lerp(68, 60, density))}ch`;

  // Space: 4px grid, scaled by density (airy = bigger steps).
  const unit = lerp(5, 3.5, density);
  // Snap to a 2px grid so spacing stays crisp.
  [1, 2, 3, 4, 6, 8, 12, 16, 24].forEach((m, i) => (vars[`--space-${i + 1}`] = `${round(Math.max(2, Math.round((unit * m) / 2) * 2) / 16, 4)}rem`));

  // Shape: formal -> tight radius; playful -> round. Raw finish -> heavier lines, harder shadows.
  const r = lerp(14, 2, formality);
  vars["--radius-sm"] = `${Math.round(r * 0.5)}px`;
  vars["--radius"] = `${Math.round(r)}px`;
  vars["--radius-lg"] = `${Math.round(r * 1.8)}px`;
  vars["--border"] = `${Math.round(lerp(2, 1, finish * 0.6 + (1 - weight) * 0.4))}px`;
  const sh = dark ? "0 0 0" : hexRgb(mix(ink, bg, 0.1));
  const hard = 1 - finish;
  vars["--shadow-1"] = weight < 0.25
    ? "none"
    : `0 1px ${Math.round(lerp(3, 0, hard))}px rgb(${sh} / ${round(lerp(0.06, 0.16, weight), 2)})`;
  vars["--shadow-2"] = hard > 0.6
    ? `${Math.round(lerp(2, 6, weight))}px ${Math.round(lerp(2, 6, weight))}px 0 rgb(${sh} / ${round(lerp(0.5, 0.9, weight), 2)})`
    : `0 ${Math.round(lerp(8, 18, weight))}px ${Math.round(lerp(24, 40, finish))}px -${Math.round(lerp(8, 14, finish))}px rgb(${sh} / ${round(lerp(0.12, 0.28, weight), 2)})`;

  // Motion: energy sets speed and overshoot.
  vars["--dur-1"] = `${Math.round(lerp(160, 110, energy))}ms`;
  vars["--dur-2"] = `${Math.round(lerp(280, 200, energy))}ms`;
  vars["--dur-3"] = `${Math.round(lerp(520, 380, energy))}ms`;
  vars["--ease-out"] = "cubic-bezier(.2,.7,.1,1)";
  vars["--ease-spring"] = `cubic-bezier(.3,${round(lerp(1.1, 1.6, energy), 2)},.5,1)`;

  Object.assign(vars, d.tokens || {});

  const report = {
    contrast: {
      "ink/bg": round(contrast(vars["--ink"], vars["--bg"]), 2),
      "ink-2/bg": round(contrast(vars["--ink-2"], vars["--bg"]), 2),
      "ink-3/bg": round(contrast(vars["--ink-3"], vars["--bg"]), 2),
      "accent-text/bg": round(contrast(vars["--accent-text"], vars["--bg"]), 2),
      "on-accent/accent": round(contrast(vars["--on-accent"], vars["--accent"]), 2),
    },
    warnings,
  };
  if (report.contrast["ink/bg"] < 7) warnings.push(`ink/bg contrast ${report.contrast["ink/bg"]} < 7 — body text will feel washed out`);
  if (report.contrast["on-accent/accent"] < 4.5) warnings.push(`on-accent/accent contrast ${report.contrast["on-accent/accent"]} < 4.5 — button labels fail AA; darken or lighten the accent`);
  if (accentText !== accent) warnings.push(`accent fails 4.5:1 as text on bg; use --accent-text (${accentText}) for links and small accent text`);
  return { vars, report };
}

function hexRgb(hex) {
  return parseHex(hex).map((v) => Math.round(v * 255)).join(" ");
}

export function toCss(vars, selector = ":root") {
  return `${selector} {\n${Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join("\n")}\n}\n`;
}

// Google Fonts URL for the families named on a card (skips system stacks).
export function googleFontsHref(direction) {
  const fams = [];
  for (const key of ["display", "body", "mono"]) {
    let spec = direction?.type?.[key];
    if (!spec) continue;
    if (typeof spec === "string") spec = { family: spec };
    if (!spec.family || spec.google === false) continue;
    const w = [...new Set(spec.weights || [spec.weight || 400])].sort((x, y) => x - y);
    const axis = spec.italic
      ? `ital,wght@${[...w.map((x) => `0,${x}`), ...w.map((x) => `1,${x}`)].join(";")}`
      : `wght@${w.join(";")}`;
    const name = spec.family.replace(/ /g, "+");
    if (!fams.some((f) => f.startsWith(name + ":"))) fams.push(`${name}:${axis}`);
  }
  return fams.length ? `https://fonts.googleapis.com/css2?${fams.map((f) => `family=${f}`).join("&")}&display=swap` : null;
}
