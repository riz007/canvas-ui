// Runs INSIDE the page (stringified by shoot.mjs). Must be self-contained.
// Returns [{ rule, level, label, count, examples }]
//   level "fix"  -> readability/robustness bug, must be fixed
//   level "tell" -> AI-default tell; remove it or justify it in the delivery notes
//   level "check"-> likely bug, confirm on the screenshot
export function lintPage() {
  const out = new Map();
  const LABELS = {
    lowContrast: ["fix", "Text contrast below WCAG AA"],
    tinyText: ["fix", "Text smaller than 12px"],
    tightLeading: ["fix", "Multi-line text with line-height under 1.25"],
    hScroll: ["fix", "Page scrolls horizontally"],
    clipped: ["fix", "Text clipped by its container"],
    stuckHidden: ["fix", "Text left invisible in the first screen (stuck entrance animation?)"],
    missingAlt: ["fix", "Image without alt attribute"],
    smallTarget: ["fix", "Tap target under 32px on a narrow viewport"],
    overlap: ["check", "Text blocks overlap each other"],
    gradientText: ["tell", "Gradient-filled text"],
    emojiIcon: ["tell", "Emoji used as icons"],
    eyebrow: ["tell", "Tiny uppercase eyebrow label above a heading"],
    sideStripe: ["tell", "Rounded card with a colored side stripe"],
    nestedCards: ["tell", "Card nested inside a card"],
    glow: ["tell", "Blurred glow blob / aurora background"],
    aiGradient: ["tell", "Purple-blue gradient"],
    glass: ["tell", "Glassmorphism (backdrop blur) on several surfaces"],
    iconTiles: ["tell", "Feature grid of icon-in-a-tinted-tile cards"],
    pills: ["tell", "Pill shape on nearly every control"],
    fontSoup: ["tell", "More than 3 font families"],
    defaultFont: ["tell", "Only a default UI font (Inter/Roboto/Arial/system) anywhere"],
    centeredLong: ["tell", "Centered paragraph longer than 3 lines"],
    longMeasure: ["tell", "Body text lines longer than ~90 characters"],
    grayOnColor: ["tell", "Gray text on a colored background"],
  };
  const add = (rule, el, note) => {
    if (!out.has(rule)) out.set(rule, { rule, level: LABELS[rule][0], label: LABELS[rule][1], count: 0, examples: [] });
    const r = out.get(rule);
    r.count++;
    if (r.examples.length < 3) r.examples.push(desc(el) + (note ? ` (${note})` : ""));
  };
  function desc(el) {
    if (!el || el === document) return "page";
    let s = el.tagName.toLowerCase();
    if (el.id) s += "#" + el.id;
    else if (typeof el.className === "string" && el.className.trim()) s += "." + el.className.trim().split(/\s+/).slice(0, 2).join(".");
    const t = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 28);
    return t ? `${s} "${t}"` : s;
  }

  // ---- color helpers ----
  const parse = (c) => {
    const m = c && c.match(/rgba?\(([^)]+)\)/);
    if (!m) {
      const o = c && c.match(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/);
      return o ? [o[1] * 255, o[2] * 255, o[3] * 255, o[4] === undefined ? 1 : +o[4]] : null;
    }
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2], p[3] === undefined ? 1 : p[3]];
  };
  const lum = ([r, g, b]) => {
    const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const blend = (top, under) => { const a = top[3]; return [0, 1, 2].map((i) => top[i] * a + under[i] * (1 - a)).concat(1); };
  const sat = ([r, g, b]) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx === 0 ? 0 : (mx - mn) / mx; };
  const hue = ([r, g, b]) => {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (!d) return 0;
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return (h * 60 + 360) % 360;
  };
  // Effective background: walk up until opaque; null if an image/gradient is in the way (can't judge).
  function bgOf(el) {
    let layers = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.backgroundImage && s.backgroundImage !== "none") return null;
      const c = parse(s.backgroundColor);
      if (c && c[3] > 0) { layers.push(c); if (c[3] >= 1) break; }
    }
    let base = [255, 255, 255, 1];
    for (const l of layers.reverse()) base = blend(l, base);
    return base;
  }

  const vw = innerWidth, vh = innerHeight;
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const s = getComputedStyle(el);
    return s.visibility !== "hidden" && s.display !== "none";
  };
  // Rendered line count of an element's own text (padding and children don't count).
  function lineCount(el) {
    const tops = new Set();
    for (const n of el.childNodes) {
      if (n.nodeType !== 3 || !n.textContent.trim()) continue;
      const range = document.createRange(); range.selectNodeContents(n);
      for (const rc of range.getClientRects()) if (rc.width > 1) tops.add(Math.round(rc.top));
    }
    return tops.size;
  }
  const ownText = (el) => [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim();
  const all = [...document.body.querySelectorAll("*")].filter((el) => !["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "svg", "path"].includes(el.tagName));
  const texty = all.filter((el) => ownText(el) && visible(el));

  // ---- fix-level ----
  for (const el of texty) {
    const s = getComputedStyle(el), fs = parseFloat(s.fontSize), r = el.getBoundingClientRect();
    if (el.closest("[aria-hidden='true']")) continue;
    // contrast
    const fg = parse(s.color), bg = bgOf(el);
    if (fg && bg && +s.opacity > 0.05) {
      const eff = blend([...fg.slice(0, 3), fg[3] * +s.opacity], bg);
      const large = fs >= 24 || (fs >= 18.66 && +s.fontWeight >= 700);
      const cr = ratio(eff, bg);
      if (cr < (large ? 3 : 4.5) && !el.closest("[disabled],[aria-disabled='true'],::placeholder")) add("lowContrast", el, cr.toFixed(2) + ":1");
      // gray text on a colored surface
      if (sat(bg) > 0.35 && sat(eff) < 0.08 && lum(eff) > 0.08 && lum(eff) < 0.6) add("grayOnColor", el);
    }
    if (fs < 12 && !["SUP", "SUB"].includes(el.tagName) && ownText(el).length > 1) add("tinyText", el, fs + "px");
    const lh = s.lineHeight === "normal" ? fs * 1.2 : parseFloat(s.lineHeight);
    const lines = lineCount(el);
    if (fs < 28 && lines >= 2 && lh / fs < 1.25) add("tightLeading", el, (lh / fs).toFixed(2));
    if ((s.overflow === "hidden" || s.overflowX === "hidden") && s.textOverflow !== "ellipsis" && el.scrollWidth > el.clientWidth + 2 && !s.webkitLineClamp?.match(/\d/)) add("clipped", el);
    if (r.top < vh && r.bottom > 0) {
      let o = 1;
      for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= +getComputedStyle(n).opacity;
      if (o < 0.05) add("stuckHidden", el);
    }
    // centered long paragraphs and measure
    if (["P", "LI", "DD", "BLOCKQUOTE"].includes(el.tagName) || (el.tagName === "DIV" && ownText(el).length > 160)) {
      if (s.textAlign === "center" && lines > 3) add("centeredLong", el);
      if (r.width / (fs * 0.5) > 95 && lines >= 2) add("longMeasure", el, Math.round(r.width / (fs * 0.5)) + "ch");
    }
  }
  if (document.documentElement.scrollWidth > vw + 1) {
    const wide = all.filter((el) => el.getBoundingClientRect().right > vw + 1 && visible(el)).sort((a, b) => b.getBoundingClientRect().right - a.getBoundingClientRect().right);
    add("hScroll", wide[wide.length - 1] || document.body, `${document.documentElement.scrollWidth}px > ${vw}px`);
  }
  for (const img of document.images) if (!img.hasAttribute("alt") && visible(img)) add("missingAlt", img);
  if (vw < 600) {
    for (const el of document.querySelectorAll("a[href],button,[role=button],input:not([type=hidden]),select")) {
      const r = el.getBoundingClientRect();
      if (visible(el) && (r.width < 32 || r.height < 32) && !el.closest("p,li")) add("smallTarget", el, `${Math.round(r.width)}x${Math.round(r.height)}`);
    }
  }
  // overlap among text blocks in the first screen
  const blocks = texty.filter((el) => { const r = el.getBoundingClientRect(); return r.top < vh && r.bottom > 0 && r.width * r.height > 200; }).slice(0, 250);
  for (let i = 0; i < blocks.length; i++) for (let j = i + 1; j < blocks.length; j++) {
    const a = blocks[i], b = blocks[j];
    if (a.contains(b) || b.contains(a)) continue;
    const A = a.getBoundingClientRect(), B = b.getBoundingClientRect();
    const w = Math.min(A.right, B.right) - Math.max(A.left, B.left), h = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
    if (w > 4 && h > 4 && (w * h) / Math.min(A.width * A.height, B.width * B.height) > 0.25) add("overlap", a, "with " + desc(b));
  }

  // ---- tells ----
  const families = new Set();
  let pillish = 0, controls = 0, glassCount = 0;
  const cardy = (s) => (parse(s.backgroundColor)?.[3] > 0 || s.boxShadow !== "none" || parseFloat(s.borderTopWidth) > 0) && parseFloat(s.borderRadius) >= 8;
  for (const el of all) {
    if (!visible(el)) continue;
    const s = getComputedStyle(el), r = el.getBoundingClientRect();
    if (ownText(el)) families.add(s.fontFamily.split(",")[0].replace(/["']/g, "").trim().toLowerCase());
    if (/text/.test(s.backgroundClip + " " + s.webkitBackgroundClip) && /gradient/.test(s.backgroundImage)) add("gradientText", el);
    if (/gradient/.test(s.backgroundImage)) {
      const cols = (s.backgroundImage.match(/rgba?\([^)]+\)/g) || []).map(parse).filter((c) => c && sat(c) > 0.3);
      const hs = cols.map(hue);
      if (hs.some((h) => h >= 255 && h <= 300) && hs.some((h) => (h >= 200 && h < 255) || (h > 300 && h <= 335))) add("aiGradient", el);
      if (/radial-gradient/.test(s.backgroundImage) && r.width > vw * 0.4 && cols.length) add("glow", el);
    }
    const blur = s.filter.match(/blur\(([\d.]+)px\)/);
    if (blur && +blur[1] >= 40) add("glow", el);
    if (/blur\(/.test(s.backdropFilter || s.webkitBackdropFilter || "")) glassCount++;
    // side stripe: one thick colored side, other sides none, rounded
    const sides = ["Top", "Right", "Bottom", "Left"].map((k) => [parseFloat(s[`border${k}Width`]), parse(s[`border${k}Color`])]);
    const thick = sides.filter(([w]) => w >= 3);
    if (thick.length === 1 && sides.filter(([w]) => w > 0).length === 1 && parseFloat(s.borderRadius) > 0 && thick[0][1] && sat(thick[0][1]) > 0.3) add("sideStripe", el);
    if (cardy(s) && r.width > 120 && r.height > 60) {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const ps = getComputedStyle(p);
        if (cardy(ps) && p.getBoundingClientRect().width < vw * 0.95) { add("nestedCards", el); break; }
      }
    }
    if (el.matches("button,a[href],[role=button],input,select,.tag,.badge,.chip")) {
      controls++;
      if (r.height > 0 && parseFloat(s.borderRadius) >= r.height / 2 - 1) pillish++;
    }
    // eyebrow: small, uppercase, tracked text right before a heading
    const next = el.nextElementSibling;
    if (ownText(el) && next && /^H[1-3]$/.test(next.tagName) && parseFloat(s.fontSize) <= 14 && (s.textTransform === "uppercase" || ownText(el) === ownText(el).toUpperCase()) && parseFloat(s.letterSpacing) > 0.5 && ownText(el).length < 40) add("eyebrow", el);
  }
  if (glassCount >= 3) add("glass", document.body, glassCount + " surfaces");
  if (controls >= 6 && pillish / controls > 0.8) add("pills", document.body, `${pillish}/${controls}`);
  if (families.size > 3) add("fontSoup", document.body, [...families].join(", "));
  const defaults = /^(inter|roboto|arial|helvetica|helvetica neue|system-ui|-apple-system|ui-sans-serif|segoe ui|open sans|sans-serif)$/;
  if (families.size && [...families].every((f) => defaults.test(f))) add("defaultFont", document.body, [...families].join(", "));

  // emoji as icons: 2+ elements whose entire text is a single emoji
  const emoji = /^(?:\p{Extended_Pictographic}️?(?:‍\p{Extended_Pictographic}️?)*)$/u;
  const emojiEls = texty.filter((el) => emoji.test(ownText(el)) && !el.closest("p,blockquote"));
  if (emojiEls.length >= 2) emojiEls.forEach((el) => add("emojiIcon", el));

  // icon tiles: >= 3 siblings that each start with a small tinted square holding an svg/icon
  const seen = new Set();
  for (const el of all) {
    const p = el.parentElement;
    if (!p || seen.has(p)) continue;
    const kids = [...p.children].filter(visible);
    if (kids.length < 3) continue;
    const tiles = kids.filter((k) => {
      const f = k.firstElementChild;
      if (!f) return false;
      const fs = getComputedStyle(f), fr = f.getBoundingClientRect();
      return fr.width >= 28 && fr.width <= 72 && Math.abs(fr.width - fr.height) < 4 && parse(fs.backgroundColor)?.[3] > 0 && parseFloat(fs.borderRadius) >= 6 && f.querySelector("svg,i,img,span");
    });
    if (tiles.length >= 3) { seen.add(p); add("iconTiles", p, tiles.length + " tiles"); }
  }

  return [...out.values()].sort((a, b) => ["fix", "check", "tell"].indexOf(a.level) - ["fix", "check", "tell"].indexOf(b.level));
}
