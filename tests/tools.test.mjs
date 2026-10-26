import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { findChrome } from "../scripts/lib/chrome.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const node = (script, args) =>
  execFileSync(process.execPath, [join(ROOT, "scripts", script), ...args], {
    encoding: "utf8",
  });
const round = () => {
  const dir = mkdtempSync(join(tmpdir(), "canvas-ui-test-"));
  cpSync(join(ROOT, "examples/fieldnote/r1"), dir, {
    recursive: true,
    filter: (p) => !p.includes("/shots") && !p.endsWith("canvas.html"),
  });
  return dir;
};
let chrome = true;
try {
  findChrome();
} catch {
  chrome = false;
}

test("canvas.mjs embeds candidates, direction data and the token engine", () => {
  const dir = round();
  const out = node("canvas.mjs", [dir]);
  assert.match(out, /3 candidates/);
  const html = readFileSync(join(dir, "canvas.html"), "utf8");
  const data = JSON.parse(
    html.match(
      /<script id="canvas-data" type="application\/json">([\s\S]*?)<\/script>/,
    )[1],
  );
  assert.equal(data.candidates.length, 3);
  assert.equal(data.candidates[1].name, "Night Exterior");
  assert.ok(data.candidates[0].direction.tone);
  assert.ok(
    data.candidates.every((c) => c.html && !/<base /.test(c.html)),
    "same-folder candidates need no <base>",
  );
  assert.match(html, /function buildTokens/);
  assert.doesNotMatch(html, /^export /m);
});

test("canvas.mjs warns when two directions are variants of one", () => {
  const dir = round();
  const b = JSON.parse(readFileSync(join(dir, "b.direction.json"), "utf8"));
  const a = JSON.parse(readFileSync(join(dir, "a.direction.json"), "utf8"));
  writeFileSync(
    join(dir, "b.direction.json"),
    JSON.stringify({ ...b, type: a.type, engine: a.engine, color: a.color }),
  );
  assert.match(node("canvas.mjs", [dir]), /likely variants/);
});

test("tokens.mjs writes CSS for every card in a folder", () => {
  const dir = round();
  node("tokens.mjs", [dir]);
  for (const id of ["a", "b", "c"])
    assert.match(
      readFileSync(join(dir, `${id}.tokens.css`), "utf8"),
      /--accent-text:/,
    );
});

test(
  "shoot.mjs captures, lints and builds sheets",
  { skip: !chrome && "no Chrome found", timeout: 120000 },
  () => {
    const dir = round();
    const page = join(dir, "bad.html");
    writeFileSync(
      page,
      `<!doctype html><html><body style="margin:0;font-family:Inter">
    <h1 style="background:linear-gradient(90deg,#7c3aed,#2563eb);-webkit-background-clip:text;background-clip:text;color:transparent">Hi</h1>
    <p style="color:#bbb;background:#fff;font-size:10px">Low contrast tiny text</p>
    <div style="width:3000px;height:10px"></div></body></html>`,
    );
    const out = join(dir, "shots");
    node("shoot.mjs", [page, "--out", out, "--size", "800x600"]);
    const report = JSON.parse(readFileSync(join(out, "report.json"), "utf8"));
    const rules = report[0].lint.map((l) => l.rule);
    for (const r of [
      "lowContrast",
      "tinyText",
      "hScroll",
      "gradientText",
      "aiGradient",
    ])
      assert.ok(rules.includes(r), `expected ${r} in ${rules}`);

    node("shoot.mjs", [dir, "--out", out, "--sheet", "--squint", "--no-lint"]);
    assert.ok(
      existsSync(join(out, "sheet.png")) && existsSync(join(out, "squint.png")),
    );
  },
);

test(
  "shoot.mjs catches horizontal overflow on mobile, where the viewport widens to fit it",
  { skip: !chrome && "no Chrome found", timeout: 120000 },
  () => {
    const dir = mkdtempSync(join(tmpdir(), "canvas-ui-test-"));
    const page = join(dir, "wide.html");
    writeFileSync(
      page,
      `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;font:16px/1.5 Georgia">
      <div style="display:flex"><code style="white-space:nowrap;font-size:20px">npx a-very-long-command-that-will-not-wrap/anywhere</code></div></body>`,
    );
    const out = join(dir, "shots");
    node("shoot.mjs", [page, "--out", out, "--size", "mobile"]);
    const report = JSON.parse(readFileSync(join(out, "report.json"), "utf8"));
    assert.ok(report[0].lint.some((l) => l.rule === "hScroll"), JSON.stringify(report[0].lint));
  },
);
