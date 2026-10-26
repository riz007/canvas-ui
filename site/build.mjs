#!/usr/bin/env node
// Assemble the demo site: site/index.html + every example round (rebuilt canvases) -> _site/
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, process.argv[2] || "_site");
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync(join(ROOT, "site/index.html"), join(OUT, "index.html"));
writeFileSync(join(OUT, ".nojekyll"), "");

for (const ex of readdirSync(join(ROOT, "examples"))) {
  for (const round of readdirSync(join(ROOT, "examples", ex)).filter((r) => /^r\d+$/.test(r))) {
    const src = join(ROOT, "examples", ex, round);
    // Rebuild so every canvas uses the current template.
    execFileSync(process.execPath, [join(ROOT, "scripts/canvas.mjs"), src], { stdio: "ignore" });
    cpSync(src, join(OUT, "examples", ex, round), { recursive: true, filter: (p) => !p.endsWith("report.json") });
    if (!existsSync(join(src, "shots/sheet.png"))) console.warn(`! ${ex}/${round} has no shots/sheet.png`);
  }
}
console.log(`site → ${OUT}`);
