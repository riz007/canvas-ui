// Minimal isolated headless Chrome over CDP. No dependencies: uses Node's global WebSocket (Node 22+;
// on Node 20 run with --experimental-websocket).
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function findChrome() {
  const env = process.env.CHROME_PATH;
  if (env && existsSync(env)) return env;
  const byPlatform = {
    darwin: [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    ],
    win32: [
      `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env["PROGRAMFILES(X86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`,
    ],
  }[process.platform] || [];
  for (const c of byPlatform) if (c && existsSync(c)) return c;
  for (const name of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "microsoft-edge"]) {
    const r = spawnSync(process.platform === "win32" ? "where.exe" : "which", [name], { encoding: "utf8" });
    if (r.status === 0 && r.stdout.trim()) return r.stdout.trim().split(/\r?\n/)[0];
  }
  throw new Error("No Chrome, Chromium, Edge or Brave found. Install one or set CHROME_PATH.");
}

export async function launch({ timeout = 20000 } = {}) {
  if (typeof WebSocket === "undefined") throw new Error("This Node has no global WebSocket. Use Node 22+, or run node --experimental-websocket.");
  const profile = mkdtempSync(join(tmpdir(), "canvas-ui-chrome-"));
  const proc = spawn(findChrome(), [
    "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
    "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--disable-background-networking",
    "--disable-component-update", "--disable-sync", "--hide-scrollbars", "--mute-audio",
    "--force-color-profile=srgb", "--font-render-hinting=none", "--allow-file-access-from-files", "about:blank",
  ], { stdio: "ignore" });

  const portFile = join(profile, "DevToolsActivePort");
  const t0 = Date.now();
  while (!existsSync(portFile) || !readFileSync(portFile, "utf8").includes("\n")) {
    if (Date.now() - t0 > timeout) { proc.kill("SIGKILL"); throw new Error("Chrome did not start in time."); }
    await new Promise((r) => setTimeout(r, 50));
  }
  const [port, path] = readFileSync(portFile, "utf8").trim().split("\n");
  const ws = new WebSocket(`ws://127.0.0.1:${port}${path}`);
  await new Promise((ok, fail) => { ws.onopen = ok; ws.onerror = () => fail(new Error("Could not connect to Chrome DevTools.")); });

  let nextId = 1;
  const pending = new Map(), listeners = new Set();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { ok, fail, method } = pending.get(msg.id); pending.delete(msg.id);
      msg.error ? fail(new Error(`${method}: ${msg.error.message}`)) : ok(msg.result);
    } else for (const l of listeners) l(msg);
  };
  const send = (method, params = {}, sessionId) => new Promise((ok, fail) => {
    const id = nextId++;
    pending.set(id, { ok, fail, method });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });

  async function newPage() {
    const { targetId } = await send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
    const s = (m, p) => send(m, p, sessionId);
    const waitFor = (method, pred = () => true, ms = timeout) => new Promise((ok, fail) => {
      const timer = setTimeout(() => { listeners.delete(fn); fail(new Error(`Timed out waiting for ${method}`)); }, ms);
      const fn = (msg) => { if (msg.sessionId === sessionId && msg.method === method && pred(msg.params)) { clearTimeout(timer); listeners.delete(fn); ok(msg.params); } };
      listeners.add(fn);
    });
    const consoleErrors = [];
    listeners.add((msg) => {
      if (msg.sessionId !== sessionId) return;
      if (msg.method === "Runtime.exceptionThrown") consoleErrors.push(msg.params.exceptionDetails?.exception?.description?.split("\n")[0] || msg.params.exceptionDetails?.text);
      if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") consoleErrors.push(`${msg.params.entry.text} ${msg.params.entry.url || ""}`.trim());
    });
    await Promise.all([s("Page.enable"), s("Runtime.enable"), s("Log.enable")]);

    const page = {
      send: s,
      consoleErrors,
      async viewport(width, height, { scale = 1, mobile = false, dark = false } = {}) {
        await s("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: scale, mobile });
        await s("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: dark ? "dark" : "light" }, { name: "prefers-reduced-motion", value: "no-preference" }] });
        if (mobile) await s("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
      },
      async goto(url, { wait = 600 } = {}) {
        const loaded = waitFor("Page.loadEventFired", () => true, timeout).catch(() => null);
        const r = await s("Page.navigate", { url });
        if (r.errorText) throw new Error(`Could not open ${url}: ${r.errorText}`);
        await loaded;
        await page.eval("document.fonts ? document.fonts.ready.then(() => true) : true");
        // Let images decode and entrance animations settle.
        await page.eval(`Promise.all([...document.images].filter(i => !i.complete).map(i => new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 4000); })))`);
        await new Promise((r) => setTimeout(r, wait));
      },
      async eval(expression) {
        const r = await s("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
        if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
        return r.result.value;
      },
      async screenshot({ full = false, clip, scale = 1 } = {}) {
        const params = { format: "png", captureBeyondViewport: full };
        if (clip) params.clip = { ...clip, scale };
        else if (full) {
          const { cssContentSize } = await s("Page.getLayoutMetrics");
          params.clip = { x: 0, y: 0, width: Math.ceil(cssContentSize.width), height: Math.min(Math.ceil(cssContentSize.height), 16000), scale };
        } else if (scale !== 1) {
          const { cssVisualViewport: v } = await s("Page.getLayoutMetrics");
          params.clip = { x: 0, y: 0, width: v.clientWidth, height: v.clientHeight, scale };
        }
        const { data } = await s("Page.captureScreenshot", params);
        return Buffer.from(data, "base64");
      },
      close: () => send("Target.closeTarget", { targetId }).catch(() => {}),
    };
    return page;
  }

  async function close() {
    try { await Promise.race([send("Browser.close"), new Promise((r) => setTimeout(r, 2000))]); } catch {}
    try { ws.close(); } catch {}
    try { proc.kill("SIGKILL"); } catch {}
    try { rmSync(profile, { recursive: true, force: true }); } catch {}
  }
  process.once("SIGINT", () => { close().finally(() => process.exit(130)); });
  return { newPage, close };
}
