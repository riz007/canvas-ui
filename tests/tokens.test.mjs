import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTokens, contrast, googleFontsHref, hexToOklch, oklchToHex } from "../scripts/lib/tokens-core.js";

const px = (rem) => parseFloat(rem) * 16;

test("OKLCH round-trips sRGB colors", () => {
  for (const hex of ["#e4572e", "#0e1511", "#f3f1ea", "#2f5bea", "#ffffff", "#000000"]) {
    assert.equal(oklchToHex(hexToOklch(hex)), hex);
  }
});

test("text tokens pass WCAG AA on light, dark and mid backgrounds", () => {
  for (const color of [
    { bg: "#f3f1ea", ink: "#1b1a17", accent: "#ffd400" },
    { bg: "#0e1511", ink: "#ece8dc", accent: "#2a2aff" },
    { bg: "#7a8b99", ink: "#0b0b0b", accent: "#e4572e" },
  ]) {
    const { vars } = buildTokens({ color });
    for (const t of ["--ink", "--ink-2", "--ink-3", "--accent-text"]) {
      assert.ok(contrast(vars[t], vars["--bg"]) >= 4.5, `${t} on ${color.bg}: ${contrast(vars[t], vars["--bg"]).toFixed(2)}`);
    }
  }
});

test("small type steps never drop below 12/13px", () => {
  for (const tone of [{ density: 100, energy: 100, weight: 100 }, { density: 0 }]) {
    const { vars } = buildTokens({ tone });
    assert.ok(px(vars["--step-n2"]) >= 12);
    assert.ok(px(vars["--step-n1"]) >= 13);
  }
});

test("dials move the right tokens", () => {
  const formal = buildTokens({ tone: { formality: 100 } }).vars, playful = buildTokens({ tone: { formality: 0 } }).vars;
  assert.ok(parseInt(formal["--radius"]) < parseInt(playful["--radius"]));
  const dense = buildTokens({ tone: { density: 100 } }).vars, airy = buildTokens({ tone: { density: 0 } }).vars;
  assert.ok(px(dense["--space-5"]) < px(airy["--space-5"]));
  const loud = buildTokens({ tone: { energy: 100 } }).vars, quiet = buildTokens({ tone: { energy: 0 } }).vars;
  assert.ok(parseInt(loud["--dur-2"]) < parseInt(quiet["--dur-2"]));
});

test("explicit token overrides win", () => {
  const { vars } = buildTokens({ tokens: { "--radius": "0px" } });
  assert.equal(vars["--radius"], "0px");
});

test("Google Fonts URL includes named families and italics", () => {
  const href = googleFontsHref({ type: { display: { family: "Instrument Serif", weights: [400], italic: true }, body: "Hanken Grotesk" } });
  assert.match(href, /family=Instrument\+Serif:ital,wght@0,400;1,400/);
  assert.match(href, /family=Hanken\+Grotesk:wght@400/);
  assert.equal(googleFontsHref({}), null);
});
