#!/usr/bin/env node
// Screenshots, contact sheets, squint test, reference diff and design lint — one isolated headless Chrome.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { launch } from "./lib/chrome.mjs";
import { lintPage } from "./lib/lint-page.js";

const HELP = `canvas-ui shoot — look at the real screen

Usage:
  node shoot.mjs <url | file.html | dir | image.png> [more...] [options]

  A dir uses its manifest.json (canvas round) or every *.html inside it.

Options:
  --size <list>       mobile (390x844) | tablet (820x1180) | desktop (1440x900) | WxH; comma-separated. Default desktop
  --full              Full-page capture instead of the first screen
  --scale <n>         Device scale factor, e.g. 2 for a 200% detail check. Default 1
  --dark              Emulate prefers-color-scheme: dark
  --selector <css>    Capture only this element (scrolled into view)
  --steps "<list>"    Actions before capture, ';'-separated:
                        click <css> | type <css> "<text>" | key <Key> | hover <css> | scroll <px>
                        wait <ms> | waitfor <css> | eval <js>
                      Prefix a step with "name:" to also capture that state, e.g. "open: click .menu"
  --frames <n>        After steps, capture n frames every --interval ms (default 80) into a strip
  --mark "<list>"     Draw numbered boxes: "1=.hero h1; 2=.cta"
  --sheet             Also write sheet.png: every capture side by side with labels
  --squint            Also write squint.png: the sheet blurred + grayscale, to compare value structure
  --compare <png>     Diff the (single) capture against a reference image -> diff.png + mismatch %
  --no-lint           Skip the design lint
  --wait <ms>         Extra settle time after load. Default 600
  --out <dir>         Output folder. Default .canvas-ui/shots
  --json              Print report.json to stdout

Examples:
  node shoot.mjs .canvas-ui/fieldnote/r1 --sheet --squint
  node shoot.mjs http://localhost:5173 --size desktop,mobile --full
  node shoot.mjs page.html --steps "open: click .menu; wait 300" --size mobile
  node shoot.mjs page.html --compare ref.png --size 1280x800
`;

const SIZES = { mobile: [390, 844], tablet: [820, 1180], desktop: [1440, 900] };
const argv = process.argv.slice(2);
if (!argv.length || argv.includes("-h") || argv.includes("--help")) { console.log(HELP); process.exit(0); }

const opt = { size: "desktop", scale: 1, wait: 600, out: ".canvas-ui/shots", interval: 80, lint: true };
const targets = [];
const flags = new Set(["full", "dark", "sheet", "squint", "json"]);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--no-lint") opt.lint = false;
  else if (a.startsWith("--")) {
    const k = a.slice(2);
    if (flags.has(k)) opt[k] = true;
    else if (["size", "scale", "selector", "steps", "frames", "interval", "mark", "compare", "wait", "out"].includes(k)) {
      if (argv[i + 1] === undefined) die(`${a} needs a value`);
      opt[k] = argv[++i];
    } else die(`Unknown option ${a}. Run with --help.`);
  } else targets.push(a);
}
function die(msg) { console.error(msg); process.exit(2); }

const sizes = String(opt.size).split(",").map((s) => {
  s = s.trim();
  if (SIZES[s]) return { name: s, w: SIZES[s][0], h: SIZES[s][1] };
  const m = s.match(/^(\d+)x(\d+)$/);
  if (!m) die(`Bad size "${s}". Use mobile, tablet, desktop or WxH.`);
  return { name: s, w: +m[1], h: +m[2] };
});

// ---- expand targets into captures ----
function fromDir(dir) {
  const mf = join(dir, "manifest.json");
  if (existsSync(mf)) {
    const m = JSON.parse(readFileSync(mf, "utf8"));
    return (m.candidates || []).map((c, i) => {
      const card = c.source && resolve(dir, c.direction || c.source.replace(/\.[^.]+$/, ".direction.json"));
      let name = c.name;
      if (!name && card && existsSync(card)) try { name = JSON.parse(readFileSync(card, "utf8")).name; } catch {}
      const label = `${String(i + 1).padStart(2, "0")} ${name || c.source || c.url}`;
      if (c.kind === "url" || c.url) return { label, url: c.url };
      const p = resolve(dir, c.source);
      return /\.(png|jpe?g|webp|gif)$/i.test(p) ? { label, image: p } : { label, url: pathToFileURL(p).href };
    });
  }
  return readdirSync(dir)
    .filter((f) => f.endsWith(".html") && !/^(canvas|index-canvas)\.html$|\.specimen\.html$/.test(f))
    .sort()
    .map((f) => ({ label: f.replace(/\.html$/, ""), url: pathToFileURL(resolve(dir, f)).href }));
}
let jobs = [];
for (const t of targets) {
  if (/^https?:\/\//.test(t) || t.startsWith("file:")) jobs.push({ label: t.replace(/^https?:\/\//, "").slice(0, 40), url: t });
  else if (!existsSync(t)) die(`Not found: ${t}`);
  else if (statSync(t).isDirectory()) jobs.push(...fromDir(t));
  else if (/\.(png|jpe?g|webp|gif)$/i.test(t)) jobs.push({ label: basename(t), image: resolve(t) });
  else jobs.push({ label: basename(t, extname(t)), url: pathToFileURL(resolve(t)).href });
}
if (!jobs.length) die("Nothing to capture.");

const steps = (opt.steps || "").split(";").map((s) => s.trim()).filter(Boolean).map((s) => {
  const m = s.match(/^([\w-]+):\s*(.*)$/);
  return m && !/^(https?|file)$/.test(m[1]) ? { name: m[1], cmd: m[2] } : { name: null, cmd: s };
});
const marks = (opt.mark || "").split(";").map((s) => s.trim()).filter(Boolean).map((s) => s.split("=").map((x) => x.trim()));

const outDir = resolve(opt.out);
mkdirSync(outDir, { recursive: true });
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "shot";

const browser = await launch();
const report = [];
const captures = []; // {label, file}
try {
  const page = await browser.newPage();
  for (const job of jobs) {
    if (job.image) { captures.push({ label: job.label, file: job.image }); report.push({ label: job.label, file: job.image, image: true }); continue; }
    for (const size of sizes) {
      const mobile = size.w < 600;
      await page.viewport(size.w, size.h, { scale: +opt.scale, mobile, dark: !!opt.dark });
      page.consoleErrors.length = 0;
      await page.goto(job.url, { wait: +opt.wait });
      const base = `${slug(job.label)}${sizes.length > 1 ? "-" + size.name : ""}${opt.dark ? "-dark" : ""}`;

      const shoot = async (suffix) => {
        if (marks.length) await page.eval(markScript(marks));
        let clip;
        if (opt.selector) {
          clip = await page.eval(`(() => { const el = document.querySelector(${JSON.stringify(opt.selector)}); if (!el) return null; el.scrollIntoView({block:"center"}); const r = el.getBoundingClientRect(); return {x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height}; })()`);
          if (!clip) throw new Error(`--selector ${opt.selector} matched nothing on ${job.label}`);
        }
        const buf = await page.screenshot({ full: !!opt.full, clip, scale: +opt.scale });
        if (marks.length) await page.eval(`document.querySelectorAll("[data-canvas-mark]").forEach(n => n.remove())`);
        const file = join(outDir, `${base}${suffix ? "-" + suffix : ""}.png`);
        writeFileSync(file, buf);
        const lint = opt.lint ? await page.eval(`(${lintPage.toString()})()`).catch((e) => [{ rule: "lintError", level: "check", label: "Lint failed: " + e.message.slice(0, 120), count: 1, examples: [] }]) : [];
        const entry = { label: `${job.label}${sizes.length > 1 ? " · " + size.name : ""}${suffix ? " · " + suffix : ""}`, file, size: `${size.w}x${size.h}`, lint, errors: [...new Set(page.consoleErrors)].slice(0, 5) };
        report.push(entry);
        captures.push({ label: entry.label, file });
        return entry;
      };

      await shoot(steps.some((s) => s.name) ? "initial" : "");
      for (const st of steps) {
        await runStep(page, st.cmd);
        if (st.name) await shoot(slug(st.name));
      }
      if (steps.length && !steps.some((s) => s.name) && !opt.frames) await shoot("after");
      if (opt.frames) {
        const frames = [];
        for (let f = 0; f < +opt.frames; f++) {
          const buf = await page.screenshot({ scale: Math.min(+opt.scale, 1) * 0.5 });
          const file = join(outDir, `${base}-frame${String(f).padStart(2, "0")}.png`);
          writeFileSync(file, buf);
          frames.push({ label: `${f * +opt.interval}ms`, file });
          await new Promise((r) => setTimeout(r, +opt.interval));
        }
        const strip = join(outDir, `${base}-frames.png`);
        writeFileSync(strip, await compose(browser, frames, { cols: Math.min(frames.length, 4), title: `${job.label} · ${opt.frames} frames` }));
        report.push({ label: `${job.label} frames`, file: strip });
      }
    }
  }

  if (opt.compare) {
    const shot = report.find((r) => !r.image && r.lint);
    if (!shot) die("--compare needs one rendered capture.");
    const res = await diff(browser, resolve(opt.compare), shot.file, join(outDir, "diff.png"));
    shot.compare = res;
  }
  if (opt.sheet || opt.squint) {
    if (opt.sheet) writeFileSync(join(outDir, "sheet.png"), await compose(browser, captures, {}));
    if (opt.squint) writeFileSync(join(outDir, "squint.png"), await compose(browser, captures, { squint: true }));
  }
} catch (e) {
  await browser.close();
  console.error(`shoot: ${String(e?.message || e).replace(/^(Error: )+/, "").split("\n")[0]}`);
  process.exit(1);
}
await browser.close();

writeFileSync(join(outDir, "report.json"), JSON.stringify(report, null, 2));
if (opt.json) { console.log(JSON.stringify(report, null, 2)); process.exit(0); }

// ---- human summary ----
const rel = (p) => p.replace(process.cwd() + "/", "");
for (const r of report) {
  console.log(`${rel(r.file)}  [${r.label}]`);
  for (const e of r.errors || []) console.log(`  ✖ console: ${e}`);
  for (const l of r.lint || []) console.log(`  ${l.level === "fix" ? "✖ fix " : l.level === "check" ? "? check" : "◇ tell"} ${l.label} ×${l.count} — ${l.examples.join("; ")}`);
  if (r.compare) console.log(`  ⇄ ${r.compare.mismatch}% of pixels differ from reference (${r.compare.ref}); size ${r.compare.sizeNote}; diff → ${rel(r.compare.diff)}`);
}
if (opt.sheet) console.log(`sheet  ${rel(join(outDir, "sheet.png"))}`);
if (opt.squint) console.log(`squint ${rel(join(outDir, "squint.png"))}  — if two blocks share the same light/dark layout, change the skeleton, not the colors`);
const fixes = report.flatMap((r) => (r.lint || []).filter((l) => l.level === "fix"));
const tells = new Set(report.flatMap((r) => (r.lint || []).filter((l) => l.level === "tell").map((l) => l.label)));
if (fixes.length || tells.size) console.log(`\nLint: ${fixes.length} must-fix finding(s); ${tells.size} AI-default tell(s). Fix every ✖. Remove each ◇ or justify it in the delivery notes. Lint reads styles, not taste — still look at the images.`);
console.log(`report ${rel(join(outDir, "report.json"))}`);

// ---------------- helpers ----------------
async function runStep(page, cmd) {
  const [verb, ...rest] = cmd.split(/\s+/);
  const arg = rest.join(" ");
  const q = (sel) => `(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error("No element for " + ${JSON.stringify(sel)}); el.scrollIntoView({block:"center"}); return el; })()`;
  const center = async (sel) => page.eval(`(() => { const r = ${q(sel)}.getBoundingClientRect(); return [r.left + r.width/2, r.top + r.height/2]; })()`);
  const mouse = (type, [x, y]) => page.send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 });
  switch (verb) {
    case "click": { const p = await center(arg); await mouse("mouseMoved", p); await mouse("mousePressed", p); await mouse("mouseReleased", p); await sleep(250); break; }
    case "hover": { await mouse("mouseMoved", await center(arg)); await sleep(250); break; }
    case "type": {
      // type <css> "text"  (selector may contain spaces)  or  type <css> text
      const m = arg.match(/^(.*?)\s+"(.*)"$/);
      const [sel, text] = m ? [m[1], m[2]] : [rest[0], rest.slice(1).join(" ")];
      await page.eval(`${q(sel)}.focus()`);
      await page.send("Input.insertText", { text }); await sleep(150); break;
    }
    case "key": await page.send("Input.dispatchKeyEvent", { type: "keyDown", key: arg, code: arg }); await page.send("Input.dispatchKeyEvent", { type: "keyUp", key: arg, code: arg }); await sleep(150); break;
    case "scroll": await page.eval(`window.scrollBy(0, ${Number(arg) || 600})`); await sleep(400); break;
    case "wait": await sleep(Number(arg) || 300); break;
    case "waitfor": await page.eval(`new Promise((ok, no) => { const t = Date.now(); (function f(){ if (document.querySelector(${JSON.stringify(arg)})) ok(true); else if (Date.now() - t > 8000) no(new Error("waitfor timed out")); else setTimeout(f, 50); })(); })`); break;
    case "eval": await page.eval(arg); await sleep(150); break;
    default: throw new Error(`Unknown step "${verb}". Use click, type, key, hover, scroll, wait, waitfor or eval.`);
  }
}
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function markScript(list) {
  return `(() => { for (const [n, sel] of ${JSON.stringify(list)}) { const el = document.querySelector(sel); if (!el) continue; const r = el.getBoundingClientRect();
    const box = document.createElement("div"); box.dataset.canvasMark = n;
    box.style.cssText = "position:absolute;z-index:2147483647;pointer-events:none;border:2px solid #ff2d55;border-radius:4px;left:" + (r.left + scrollX - 4) + "px;top:" + (r.top + scrollY - 4) + "px;width:" + (r.width + 8) + "px;height:" + (r.height + 8) + "px";
    const tag = document.createElement("b"); tag.textContent = n; tag.style.cssText = "position:absolute;left:-2px;top:-24px;background:#ff2d55;color:#fff;font:700 13px/22px system-ui;padding:0 7px;border-radius:4px";
    box.appendChild(tag); document.body.appendChild(box); } })()`;
}

function dataUrl(file) { return `data:image/${extname(file).slice(1).replace("jpg", "jpeg")};base64,${readFileSync(file).toString("base64")}`; }

// Contact sheet rendered as an HTML page in the same browser — no image libraries needed.
async function compose(browser, items, { cols, squint = false, title } = {}) {
  const n = items.length;
  cols = cols || (n <= 3 ? n : n === 4 ? 2 : 3);
  const width = Math.min(2400, cols * 560 + 48);
  const html = `<!doctype html><meta charset=utf-8><style>
    body{margin:0;background:#16161a;color:#e7e7ea;font:500 14px/1.3 ui-sans-serif,system-ui,sans-serif;padding:24px;width:${width - 48}px}
    h1{font-size:13px;font-weight:600;color:#9a9aa3;margin:0 0 16px;letter-spacing:.02em}
    .g{display:grid;grid-template-columns:repeat(${cols},1fr);gap:20px;align-items:start}
    figure{margin:0}img{display:block;width:100%;border-radius:6px;background:#222;${squint ? "filter:grayscale(1) blur(7px) contrast(1.15);" : ""}box-shadow:0 0 0 1px #2a2a30}
    figcaption{margin-top:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}</style>
    ${title || squint ? `<h1>${title || "Squint test — compare light/dark masses, not details"}</h1>` : ""}
    <div class=g>${items.map((it) => `<figure><img src="${pathToFileURL(it.file).href}"><figcaption>${it.label.replace(/</g, "&lt;")}</figcaption></figure>`).join("")}</div>`;
  const tmp = join(outDir, `.sheet-${process.pid}.html`);
  writeFileSync(tmp, html);
  const p = await browser.newPage();
  await p.viewport(width, 400);
  await p.goto(pathToFileURL(tmp).href, { wait: 100 });
  const buf = await p.screenshot({ full: true });
  await p.close();
  rmSync(tmp, { force: true });
  return buf;
}

// Pixel diff in a canvas: reference vs capture (capture resized to reference width).
async function diff(browser, ref, shot, outFile) {
  const p = await browser.newPage();
  await p.viewport(800, 600);
  await p.goto("about:blank", { wait: 0 });
  const res = await p.eval(`(async () => {
    const load = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error("decode failed")); i.src = src; });
    const [a, b] = await Promise.all([load(${JSON.stringify(dataUrl(ref))}), load(${JSON.stringify(dataUrl(shot))})]);
    const w = a.naturalWidth, h = a.naturalHeight;
    const c = (img) => { const cv = new OffscreenCanvas(w, h), x = cv.getContext("2d"); x.drawImage(img, 0, 0, w, img.naturalHeight * (w / img.naturalWidth)); return x.getImageData(0, 0, w, h); };
    const A = c(a), B = c(b), out = new OffscreenCanvas(w * 3, h), o = out.getContext("2d");
    const D = o.createImageData(w, h); let bad = 0;
    for (let i = 0; i < A.data.length; i += 4) {
      const d = Math.abs(A.data[i]-B.data[i]) + Math.abs(A.data[i+1]-B.data[i+1]) + Math.abs(A.data[i+2]-B.data[i+2]);
      const g = 0.3*A.data[i] + 0.59*A.data[i+1] + 0.11*A.data[i+2];
      if (d > 48) { bad++; D.data[i]=255; D.data[i+1]=40; D.data[i+2]=90; D.data[i+3]=255; }
      else { D.data[i]=D.data[i+1]=D.data[i+2]=200 + g*0.2; D.data[i+3]=255; }
    }
    o.drawImage(a, 0, 0, w, h); o.putImageData(D, w, 0); o.drawImage(b, w*2, 0, w, b.naturalHeight * (w / b.naturalWidth));
    const blob = await out.convertToBlob({ type: "image/png" });
    const buf = new Uint8Array(await blob.arrayBuffer()); let s = ""; for (let i = 0; i < buf.length; i += 32768) s += String.fromCharCode(...buf.subarray(i, i + 32768));
    return { png: btoa(s), mismatch: +(bad / (w*h) * 100).toFixed(2), ref: w + "x" + h, shot: b.naturalWidth + "x" + b.naturalHeight };
  })()`);
  await p.close();
  writeFileSync(outFile, Buffer.from(res.png, "base64"));
  const ratio = (s) => { const [w, h] = s.split("x").map(Number); return h / w; };
  const sizeNote = Math.abs(ratio(res.ref) - ratio(res.shot)) > 0.02 ? `capture ${res.shot} vs reference ${res.ref} — aspect differs, match --size first` : `matched (${res.ref})`;
  return { mismatch: res.mismatch, ref: basename(ref), diff: outFile, sizeNote };
}
