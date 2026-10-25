#!/usr/bin/env node
// Build the comparison canvas: candidates (HTML / URL / image) + direction cards -> one self-contained canvas.html
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawn } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const HELP = `canvas-ui canvas — compare directions side by side

Usage:
  node canvas.mjs <dir | manifest.json | a.html b.html ...> [options]

Options:
  --out <file>       Output path. Default: canvas.html next to the inputs
  --title <text>     Canvas title (default: manifest title or folder name)
  --round <id>       Round label shown on the canvas and in picks, e.g. r1
  --question <text>  The decision you are asking the user to make
  --viewport <v>     Initial viewport: desktop | tablet | mobile | native
  --open             Open the canvas in the default browser when done
  --serve [port]     Serve the canvas folder over http (for agent browser panes); prints the URL, runs until stopped

Inputs:
  A dir uses manifest.json if present; otherwise every *.html (except canvas.html and *.specimen.html),
  paired automatically with <stem>.direction.json when it exists.

manifest.json (all fields optional except candidates[].source or candidates[].url):
  {
    "title": "Fieldnote", "round": "r1", "question": "Which direction should we build?", "viewport": "desktop",
    "candidates": [
      { "source": "a.html", "direction": "a.direction.json" },
      { "source": "current.png", "kind": "image", "name": "Current site", "baseline": true },
      { "kind": "url", "url": "http://localhost:5173/", "name": "Live branch", "nativeViewport": "1280x800" }
    ]
  }
  Per-candidate overrides: name, concept, typography, palette[], traits[], skeleton, hero, interactive, nativeViewport.
`;

const argv = process.argv.slice(2);
if (!argv.length || argv.includes("-h") || argv.includes("--help")) { console.log(HELP); process.exit(0); }
const opt = {}, inputs = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--open") opt.open = true;
  else if (a === "--serve") opt.serve = /^\d+$/.test(argv[i + 1] || "") ? +argv[++i] : 0;
  else if (["--out", "--title", "--round", "--question", "--viewport"].includes(a)) opt[a.slice(2)] = argv[++i];
  else if (a.startsWith("--")) die(`Unknown option ${a}. Run with --help.`);
  else inputs.push(a);
}
function die(m) { console.error(m); process.exit(2); }

// ---- collect candidates ----
let manifest = { candidates: [] }, baseDir;
const problems = [];
if (inputs.length === 1 && existsSync(inputs[0]) && statSync(inputs[0]).isDirectory()) {
  baseDir = resolve(inputs[0]);
  const mf = join(baseDir, "manifest.json");
  if (existsSync(mf)) manifest = JSON.parse(readFileSync(mf, "utf8"));
  else manifest.candidates = readdirSync(baseDir)
    .filter((f) => f.endsWith(".html") && f !== "canvas.html" && !f.endsWith(".specimen.html"))
    .sort().map((f) => ({ source: f }));
} else if (inputs.length === 1 && inputs[0].endsWith(".json")) {
  baseDir = dirname(resolve(inputs[0]));
  manifest = JSON.parse(readFileSync(inputs[0], "utf8"));
} else {
  baseDir = dirname(resolve(inputs[0]));
  manifest.candidates = inputs.map((p) => ({ source: relative(baseDir, resolve(p)) }));
}
if (!manifest.candidates?.length) die(`No candidates found in ${inputs.join(" ")}. Add *.html files or a manifest.json.`);

const outPath = resolve(opt.out || join(baseDir, "canvas.html"));
const candidates = manifest.candidates.map((raw, i) => {
  const c = { ...raw };
  const tag = `candidate ${i + 1}`;
  if (c.url && !c.kind) c.kind = "url";
  if (!c.kind) c.kind = /\.(png|jpe?g|webp|gif|avif)$/i.test(c.source || "") ? "image" : "html";
  let direction = null;
  // direction card: explicit, or <stem>.direction.json
  const dirPath = c.direction ? resolve(baseDir, c.direction)
    : c.source ? resolve(baseDir, c.source.replace(/\.[^.]+$/, ".direction.json")) : null;
  if (dirPath && existsSync(dirPath)) {
    try { direction = JSON.parse(readFileSync(dirPath, "utf8")); } catch (e) { problems.push(`${tag}: ${basename(dirPath)} is not valid JSON (${e.message})`); }
  } else if (c.direction) problems.push(`${tag}: direction card ${c.direction} not found`);

  const out = {
    kind: c.kind,
    source: c.source || c.url,
    name: c.name || direction?.name,
    concept: c.concept || direction?.northStar,
    typography: c.typography || typeSummary(direction),
    skeleton: c.skeleton || direction?.skeleton,
    hero: c.hero || direction?.hero,
    palette: c.palette || paletteOf(direction),
    traits: c.traits || direction?.traits,
    baseline: !!c.baseline,
    interactive: !!c.interactive,
    nativeViewport: c.nativeViewport || manifest.nativeViewport,
    direction,
  };
  if (c.kind === "html") {
    const p = resolve(baseDir, c.source);
    if (!existsSync(p)) { problems.push(`${tag}: ${c.source} not found`); return null; }
    let html = readFileSync(p, "utf8");
    out.name ||= (html.match(/<title>([^<]*)<\/title>/i)?.[1] || basename(p, ".html")).trim();
    // srcdoc keeps frames same-origin with the canvas (sync scroll, live Tune) and inherits the canvas's base URL.
    // A relative <base> (only when the candidate lives elsewhere) keeps its assets working over file:// and http alike.
    const relDir = relative(dirname(outPath), dirname(p)).split("\\").join("/");
    if (relDir) {
      const base = `<base href="${relDir}/">`;
      html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + base) : base + html;
    }
    out.html = html;
    out.open = relative(dirname(outPath), p).split("\\").join("/");
    if (!direction) problems.push(`${tag}: no direction card (${basename(p, ".html")}.direction.json) — the canvas will show no palette, dials or Tune`);
  } else if (c.kind === "image") {
    const p = resolve(baseDir, c.source);
    if (!existsSync(p)) { problems.push(`${tag}: ${c.source} not found`); return null; }
    out.image = relative(dirname(outPath), p).split("\\").join("/");
    out.open = out.image;
    out.name ||= basename(p, extname(p));
  } else {
    if (!c.url) { problems.push(`${tag}: kind "url" needs a url`); return null; }
    out.url = c.url; out.open = c.url;
    out.name ||= c.url.replace(/^https?:\/\//, "");
  }
  return out;
}).filter(Boolean);

if (!candidates.length) die(problems.join("\n"));

// Divergence check across direction cards: of skeleton, type, color, hero — any two share at most one.
const warnings = [];
const cards = candidates.filter((c) => c.direction);
for (let i = 0; i < cards.length; i++) for (let j = i + 1; j < cards.length; j++) {
  const A = cards[i].direction, B = cards[j].direction, same = [];
  if (fam(A.type?.display) && fam(A.type?.display) === fam(B.type?.display)) same.push("display font");
  if (A.color?.accent && B.color?.accent && hueDist(A.color.accent, B.color.accent) < 25 && Math.abs(lum(A.color.bg) - lum(B.color.bg)) < 0.25) same.push("color family");
  if (A.engine?.kind && A.engine.kind === B.engine?.kind) same.push("engine");
  const dials = Object.keys(A.tone || {}).filter((k) => typeof A.tone[k] === "number");
  if (dials.length >= 4 && dials.every((k) => Math.abs(A.tone[k] - (B.tone?.[k] ?? 50)) < 15)) same.push("tone");
  if (same.length >= 2) warnings.push(`"${A.name}" and "${B.name}" share ${same.join(" + ")} — likely variants of one direction. Rewrite one from a different engine.`);
}

// ---- assemble ----
const data = {
  title: opt.title || manifest.title || basename(baseDir),
  round: opt.round || manifest.round || "",
  question: opt.question || manifest.question || "",
  note: manifest.note || "",
  viewport: opt.viewport || manifest.viewport || "desktop",
  candidates,
};
const core = readFileSync(join(HERE, "lib/tokens-core.js"), "utf8").replace(/^export /gm, "");
const tpl = readFileSync(join(HERE, "../assets/canvas.html"), "utf8");
const json = JSON.stringify(data).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
const html = tpl.replace("/*__DATA__*/", () => json).replace("/*__TOKENS_CORE__*/", () => core.replace(/<\/script/gi, "<\\/script"));
writeFileSync(outPath, html);

console.log(`canvas ${outPath}`);
console.log(`  ${candidates.length} candidates: ${candidates.map((c, i) => `${String(i + 1).padStart(2, "0")} ${c.name}${c.baseline ? " (current)" : ""}`).join(" · ")}`);
for (const p of problems) console.log(`  ! ${p}`);
for (const w of warnings) console.log(`  ≈ ${w}`);
if (candidates.some((c) => c.kind === "url")) console.log("  Keep the dev server running while the user reviews URL candidates.");
console.log("  The user picks → the canvas copies a paste-ready instruction (pick, keep/change notes, token overrides).");
if (opt.serve !== undefined) {
  const { createServer } = await import("node:http");
  const root = dirname(outPath);
  const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".mp4": "video/mp4" };
  const server = createServer((req, res) => {
    const path = resolve(root, "." + decodeURIComponent(new URL(req.url, "http://x").pathname));
    const file = path === root || path === root + "/" ? outPath : path;
    if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "content-type": types[extname(file).toLowerCase()] || "application/octet-stream", "cache-control": "no-store" });
    res.end(readFileSync(file));
  });
  server.listen(opt.serve, "127.0.0.1", () => console.log(`  serving http://127.0.0.1:${server.address().port}/${basename(outPath)}  (Ctrl+C to stop)`));
}
if (opt.open) spawn(process.platform === "darwin" ? "open" : process.platform === "win32" ? "explorer" : "xdg-open", [outPath], { stdio: "ignore", detached: true }).unref();

// ---- helpers ----
function fam(spec) { return typeof spec === "string" ? spec : spec?.family; }
function typeSummary(d) {
  if (!d?.type) return undefined;
  const parts = [["display", d.type.display], ["body", d.type.body], ["mono", d.type.mono]]
    .filter(([, s]) => fam(s)).map(([k, s]) => `${fam(s)}${s.weight ? " " + s.weight : ""} (${k})`);
  return parts.join(" · ") || undefined;
}
function paletteOf(d) {
  if (!d?.color) return undefined;
  return [d.color.bg, d.color.ink, d.color.accent, ...Object.values(d.color.extra || {})].filter(Boolean);
}
function rgb(hex) { const h = String(hex || "#888").replace("#", ""); const f = h.length === 3 ? h.split("").map((x) => x + x).join("") : h; return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) / 255); }
function lum(hex) { return rgb(hex).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0); }
function hueDist(a, b) {
  const h = (hex) => { const [r, g, bl] = rgb(hex), mx = Math.max(r, g, bl), mn = Math.min(r, g, bl), d = mx - mn; if (!d) return -1;
    const x = mx === r ? ((g - bl) / d) % 6 : mx === g ? (bl - r) / d + 2 : (r - g) / d + 4; return (x * 60 + 360) % 360; };
  const x = h(a), y = h(b); if (x < 0 || y < 0) return x === y ? 0 : 180;
  const d = Math.abs(x - y); return Math.min(d, 360 - d);
}
