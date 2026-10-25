#!/usr/bin/env node
// direction.json -> tokens.css (+ optional specimen.html)
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, basename, resolve } from "node:path";
import { buildTokens, toCss, googleFontsHref, DIALS } from "./lib/tokens-core.js";

const HELP = `canvas-ui tokens — turn direction cards into CSS design tokens

Usage:
  node tokens.mjs <direction.json | dir> [more...] [options]

Options:
  --out <file>      Output CSS path (single input only). Default: <name>.tokens.css next to the card
  --specimen        Also write <name>.specimen.html: swatches, type scale, controls
  --json            Print tokens as JSON instead of writing files
  --set k=v         Override a card field before building, e.g. --set tone.energy=80 --set color.accent=#e4572e

A dir input processes every *.direction.json inside it.
Dials (0-100): ${Object.entries(DIALS).map(([k, [a, b]]) => `${k} (${a}→${b})`).join(", ")}
`;

const args = process.argv.slice(2);
if (!args.length || args.includes("-h") || args.includes("--help")) { console.log(HELP); process.exit(0); }

const inputs = [], sets = [];
let out = null, specimen = false, asJson = false;
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--out") out = args[++i];
  else if (a === "--specimen") specimen = true;
  else if (a === "--json") asJson = true;
  else if (a === "--set") sets.push(args[++i]);
  else if (a.startsWith("--")) { console.error(`Unknown option ${a}\n\n${HELP}`); process.exit(2); }
  else inputs.push(a);
}

const files = inputs.flatMap((p) => {
  if (!existsSync(p)) { console.error(`Not found: ${p}`); process.exit(2); }
  if (statSync(p).isDirectory()) return readdirSync(p).filter((f) => f.endsWith(".direction.json")).sort().map((f) => join(p, f));
  return [p];
});
if (!files.length) { console.error("No *.direction.json files found."); process.exit(2); }
if (out && files.length > 1) { console.error("--out only works with a single input."); process.exit(2); }

function setPath(obj, path, raw) {
  let v = raw;
  if (/^-?\d+(\.\d+)?$/.test(raw)) v = Number(raw);
  else if (raw === "true" || raw === "false") v = raw === "true";
  const keys = path.split(".");
  let o = obj;
  for (const k of keys.slice(0, -1)) o = o[k] ??= {};
  o[keys.at(-1)] = v;
}

const all = {};
for (const file of files) {
  const card = JSON.parse(readFileSync(file, "utf8"));
  for (const s of sets) { const [k, ...v] = s.split("="); setPath(card, k, v.join("=")); }
  const { vars, report } = buildTokens(card);
  const stem = basename(file).replace(/\.direction\.json$|\.json$/, "");
  if (asJson) { all[stem] = { vars, report }; continue; }

  const fonts = googleFontsHref(card);
  const header = `/* canvas-ui tokens · ${card.name || stem} · generated from ${basename(file)} — edit the card, not this file */\n`
    + (fonts ? `@import url("${fonts}");\n` : "");
  const cssPath = resolve(out || join(dirname(file), `${stem}.tokens.css`));
  writeFileSync(cssPath, header + toCss(vars));
  const c = report.contrast;
  console.log(`${stem}: ${cssPath}\n  contrast ink ${c["ink/bg"]} · ink-2 ${c["ink-2/bg"]} · accent text ${c["accent-text/bg"]} · button ${c["on-accent/accent"]}`);
  for (const w of report.warnings) console.log(`  ! ${w}`);

  if (specimen) {
    const sp = join(dirname(cssPath), `${stem}.specimen.html`);
    writeFileSync(sp, specimenHtml(card, basename(cssPath)));
    console.log(`  specimen ${sp}`);
  }
}
if (asJson) console.log(JSON.stringify(all, null, 2));

function specimenHtml(card, cssFile) {
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  const swatches = ["bg", "surface", "surface-2", "line", "line-strong", "ink", "ink-2", "ink-3", "accent", "accent-soft", "focus"];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(card.name)} · specimen</title><link rel="stylesheet" href="${esc(cssFile)}">
<style>
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:var(--weight-body) var(--step-0)/var(--leading-body) var(--font-body);padding:var(--space-7) var(--space-6)}
h1{font:var(--weight-display) var(--step-5)/var(--leading-tight) var(--font-display);letter-spacing:var(--tracking-display);margin:0 0 var(--space-3)}
.ns{color:var(--ink-2);max-width:var(--measure);margin:0 0 var(--space-7)}
.row{display:flex;flex-wrap:wrap;gap:var(--space-3);margin-bottom:var(--space-7)}
.sw{width:112px}.sw i{display:block;height:64px;border-radius:var(--radius);border:var(--border) solid var(--line)}.sw small{display:block;font:var(--step-n1)/1.4 var(--font-mono);color:var(--ink-2);margin-top:6px}
.scale p{margin:0 0 var(--space-2);font-family:var(--font-display);font-weight:var(--weight-display);letter-spacing:var(--tracking-display);line-height:var(--leading-tight)}
.scale span{font:var(--step-n2) var(--font-mono);color:var(--ink-3);margin-right:var(--space-3)}
button{font:600 var(--step-0)/1 var(--font-body);padding:var(--space-3) var(--space-5);border-radius:var(--radius);border:var(--border) solid transparent;cursor:pointer;transition:transform var(--dur-1) var(--ease-spring),background var(--dur-2) var(--ease-out)}
.primary{background:var(--accent);color:var(--on-accent);box-shadow:var(--shadow-1)}.primary:hover{background:var(--accent-hover)}.primary:active{transform:scale(.97)}
.ghost{background:transparent;color:var(--ink);border-color:var(--line-strong)}
input{font:inherit;padding:var(--space-3) var(--space-4);border-radius:var(--radius);border:var(--border) solid var(--line-strong);background:var(--surface);color:var(--ink);min-width:260px}
input:focus{outline:2px solid var(--focus);outline-offset:2px}
.card{background:var(--surface);border:var(--border) solid var(--line);border-radius:var(--radius-lg);padding:var(--space-5);box-shadow:var(--shadow-2);max-width:420px}
a{color:var(--accent-text)}
</style></head><body>
<h1>${esc(card.name)}</h1><p class="ns">${esc(card.northStar)}</p>
<div class="row">${swatches.map((s) => `<div class="sw"><i style="background:var(--${s})"></i><small>--${s}</small></div>`).join("")}</div>
<div class="scale">${[6, 5, 4, 3, 2, 1, 0, "n1"].map((s) => `<p style="font-size:var(--step-${s})"><span>step-${s}</span>Field recordings, kept honest</p>`).join("")}</div>
<div class="row" style="margin-top:var(--space-7);align-items:center"><button class="primary">Primary action</button><button class="ghost">Secondary</button><input placeholder="Search the library"><a href="#">Inline link</a></div>
<div class="card"><strong>Card surface</strong><p style="color:var(--ink-2);margin:var(--space-2) 0 0">Body copy on the surface layer uses ink-2 for supporting text.</p></div>
</body></html>`;
}
