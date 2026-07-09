'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const EXTENSION_DIR = path.join(ROOT, 'Extension');
const DEFAULT_BRAVE = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
const DEFAULT_IRON = 'C:\\Program Files\\SRWare Iron (64-Bit)\\chrome.exe';

const browserName = (process.env.HXD_BROWSER || 'brave').toLowerCase();
const executablePath = process.env.HXD_BROWSER_PATH ||
  (browserName === 'iron' ? DEFAULT_IRON : DEFAULT_BRAVE);
const repeat = Math.max(1, parseInt(process.env.HXD_REPEAT || '1', 10) || 1);
const phaseMs = Math.max(800, parseInt(process.env.HXD_PHASE_MS || '2500', 10) || 2500);
const nickPrefix = process.env.HXD_NICK || 'codex';
const makeRoom = process.env.HXD_CREATE_ROOM !== '0';
const headed = process.env.HXD_HEADLESS !== '1';

if (!fs.existsSync(executablePath)) {
  console.error(JSON.stringify({ ok: false, error: 'browser executable missing', executablePath }, null, 2));
  process.exit(2);
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

function killProfileProcesses(userDataDir) {
  if (process.platform !== 'win32') return;
  const escaped = userDataDir.replace(/'/g, "''");
  const ps = [
    "$profile = '" + escaped + "'",
    "$procs = Get-CimInstance Win32_Process -Filter \"name='brave.exe' or name='chrome.exe'\" | Where-Object { $_.CommandLine -like ('*' + $profile + '*') }",
    "$procs | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }",
  ].join('; ');
  try {
    execFileSync('powershell.exe', ['-NoProfile', '-Command', ps], { stdio: 'ignore', timeout: 8000 });
  } catch (e) {}
}

async function injectPerfProbe(target) {
  await target.evaluate(() => {
    if (window.__hxdPerfProbe) return;
    const state = {
      marks: [],
      rafDeltas: [],
      longTasks: [],
      mutations: 0,
      addedNodes: 0,
      phase: 'boot',
      lastRaf: performance.now(),
      rafRunning: true,
      pageErrors: [],
      localFailures: [],
    };

    function sampleRaf(now) {
      if (!state.rafRunning) return;
      const delta = now - state.lastRaf;
      state.lastRaf = now;
      if (delta >= 0 && delta < 10000) state.rafDeltas.push(delta);
      requestAnimationFrame(sampleRaf);
    }
    requestAnimationFrame(sampleRaf);

    try {
      const mo = new MutationObserver((mutations) => {
        state.mutations += mutations.length;
        for (const mut of mutations) state.addedNodes += mut.addedNodes ? mut.addedNodes.length : 0;
      });
      mo.observe(document.documentElement || document, { childList: true, subtree: true });
      state.mo = mo;
    } catch (e) {
      state.localFailures.push('mutation-observer:' + (e && e.message || e));
    }

    try {
      if ('PerformanceObserver' in window) {
        const po = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            state.longTasks.push({ name: entry.name, duration: entry.duration, startTime: entry.startTime });
          }
        });
        po.observe({ entryTypes: ['longtask'] });
        state.po = po;
      }
    } catch (e) {
      state.localFailures.push('longtask-observer:' + (e && e.message || e));
    }

    window.addEventListener('error', (event) => {
      state.pageErrors.push(String(event.message || event.error || 'error'));
    });
    window.addEventListener('unhandledrejection', (event) => {
      state.pageErrors.push(String(event.reason && event.reason.message || event.reason || 'rejection'));
    });

    function viewName() {
      const names = [];
      if (document.querySelector('.room-view')) names.push('room-view');
      if (document.querySelector('.game-view')) names.push('game-view');
      if (document.querySelector('.roomlist-view')) names.push('roomlist-view');
      if (document.querySelector('.dialog')) names.push('dialog');
      if (document.querySelector('#hxd-roomlist-preview-root')) names.push('roomlist-preview');
      if (document.documentElement.classList.contains('showing-room-view') || window.__hxdRoomMenuVisible) names.push('menu');
      return names.join('+') || 'unknown';
    }

    function pct(values, p) {
      if (!values.length) return 0;
      const sorted = values.slice().sort((a, b) => a - b);
      const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
      return sorted[idx];
    }

    function countPlayers() {
      return document.querySelectorAll('[class^="player-list-item"], .player-list-item').length;
    }

    function countRooms() {
      return document.querySelectorAll('[data-room-id], .room-row, .roomlist-room').length;
    }

    window.__hxdPerfProbe = {
      state,
      reset(phase) {
        state.phase = phase || state.phase;
        state.rafDeltas = [];
        state.longTasks = [];
        state.mutations = 0;
        state.addedNodes = 0;
        state.pageErrors = [];
        state.localFailures = [];
        state.lastRaf = performance.now();
      },
      summary(label) {
        const raf = state.rafDeltas.slice(1);
        const longTasks = state.longTasks.map((x) => x.duration);
        const fpsText = (document.querySelector('[data-hook="fps"]') || document.querySelector('.stats-view [data-hook="fps"]') || {}).textContent || '';
        return {
          label,
          phase: state.phase,
          href: location.href,
          view: viewName(),
          players: countPlayers(),
          rooms: countRooms(),
          rafSamples: raf.length,
          rafAvg: raf.length ? raf.reduce((a, b) => a + b, 0) / raf.length : 0,
          rafP95: pct(raf, 95),
          rafP99: pct(raf, 99),
          rafMax: raf.length ? Math.max(...raf) : 0,
          rafOver50: raf.filter((x) => x > 50).length,
          rafOver100: raf.filter((x) => x > 100).length,
          rafOver200: raf.filter((x) => x > 200).length,
          longTaskCount: longTasks.length,
          longTaskMax: longTasks.length ? Math.max(...longTasks) : 0,
          longTaskTotal: longTasks.reduce((a, b) => a + b, 0),
          mutations: state.mutations,
          addedNodes: state.addedNodes,
          fpsText,
          localFailures: state.localFailures.slice(0, 20),
          pageErrors: state.pageErrors.slice(0, 20),
          roomMenuVisible: !!window.__hxdRoomMenuVisible,
        };
      },
    };
  });
}

async function findGameFrame(page) {
  for (let i = 0; i < 80; i++) {
    const frames = page.frames();
    for (const frame of frames) {
      try {
        if (/\/g\/game\.html\b|\/game\.html\b/.test(frame.url())) return frame;
      } catch (e) {}
    }
    for (const frame of frames) {
      try {
        const body = await frame.locator('body').innerText({ timeout: 600 }).catch(() => '');
        if (/HaxBall Zero|NICK:|Entrar no jogo|Entrar al juego|Jugar en an[oó]nimo/i.test(body)) return frame;
        const hasNick = await frame.locator('input, button').count();
        const url = frame.url();
        if (hasNick && /html5\.haxball|__cache_static__\/g/.test(url)) return frame;
      } catch (e) {}
    }
    await page.waitForTimeout(250);
  }
  return page.mainFrame();
}

async function waitForGameReady(frame) {
  await frame.waitForFunction(() => {
    const inputs = Array.from(document.querySelectorAll('input')).filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 20 && r.height > 10 && getComputedStyle(el).visibility !== 'hidden';
    });
    const buttons = Array.from(document.querySelectorAll('button')).filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 20 && r.height > 10 && getComputedStyle(el).visibility !== 'hidden';
    });
    return inputs.length >= 1 && buttons.some((el) => /ok|entrar|jugar|play|jogo/i.test((el.textContent || '').trim()));
  }, { timeout: 25000 });
}

async function clickOk(frame, nick) {
  await frame.evaluate((value) => {
    const inputs = Array.from(document.querySelectorAll('input')).filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 20 && r.height > 10 && getComputedStyle(el).visibility !== 'hidden';
    });
    const input = inputs[inputs.length - 1];
    if (!input) throw new Error('nick input not found');
    input.focus();
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, nick);
  await frame.waitForTimeout(80);
  const clicked = await frame.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const button = buttons.find((el) => /^(ok|entrar|jugar|play|entrar al juego|entrar no jogo)$/i.test((el.textContent || '').trim())) ||
      buttons.find((el) => /ok|entrar|jugar|play|jogo/i.test((el.textContent || '').trim()));
    if (!button) return false;
    button.click();
    return true;
  });
  if (!clicked) throw new Error('OK button not found');
}

async function phase(frame, label, ms = phaseMs) {
  await injectPerfProbe(frame);
  await frame.evaluate((phaseLabel) => window.__hxdPerfProbe.reset(phaseLabel), label);
  await frame.waitForTimeout(ms);
  return await frame.evaluate((phaseLabel) => window.__hxdPerfProbe.summary(phaseLabel), label);
}

async function tryCreateRoom(frame, name) {
  const result = await frame.evaluate(async (roomName) => {
    const payload = { name: roomName, password: '', max: 12, unlisted: true };
    try {
      document.dispatchEvent(new CustomEvent('hxd-roomlist-preview-cmd', {
        detail: { action: 'create', payload },
      }));
      return { dispatched: true };
    } catch (e) {
      return { dispatched: false, error: String(e && e.message || e) };
    }
  }, name);
  return result;
}

async function ensureRoomOrGame(frame, name) {
  if (!makeRoom) return { skipped: true };
  const before = await frame.evaluate(() => ({
    api: !!window.__hxdRoomlistPreviewApi,
    preview: !!document.querySelector('#hxd-roomlist-preview-root'),
    view: document.querySelector('.room-view') ? 'room-view' : document.querySelector('.game-view') ? 'game-view' : 'other',
  }));
  const createResult = await tryCreateRoom(frame, name);
  let reached = false;
  for (let i = 0; i < 80; i++) {
    reached = await frame.evaluate(() => !!(document.querySelector('.room-view') || document.querySelector('.game-view')));
    if (reached) break;
    await frame.waitForTimeout(250);
  }
  let joinResult = null;
  if (!reached && process.env.HXD_JOIN_PUBLIC !== '0') {
    joinResult = await frame.evaluate(() => {
      try {
        const api = window.__hxdRoomlistPreviewApi;
        const rooms = api && api.scanRooms ? api.scanRooms() : [];
        const candidate = rooms
          .filter((room) => room && room.name && !room.locked && (!room.max || room.players < room.max))
          .sort((a, b) => (b.players || 0) - (a.players || 0))[0];
        if (!candidate) return { attempted: false, rooms: rooms.length };
        document.dispatchEvent(new CustomEvent('hxd-roomlist-preview-cmd', {
          detail: { action: 'join', payload: { name: candidate.name } },
        }));
        return { attempted: true, rooms: rooms.length, candidate };
      } catch (e) {
        return { attempted: false, error: String(e && e.message || e) };
      }
    });
    for (let j = 0; j < 100; j++) {
      reached = await frame.evaluate(() => !!(document.querySelector('.room-view') || document.querySelector('.game-view')));
      if (reached) break;
      await frame.waitForTimeout(250);
    }
  }
  return { before, createResult, joinResult, reached };
}

async function toggleMenu(frame) {
  const out = { attempted: false, key: false, button: false };
  try {
    await frame.page().keyboard.press('Escape');
    out.attempted = true;
    out.key = true;
  } catch (e) {
    out.keyError = String(e && e.message || e);
  }
  await frame.waitForTimeout(400);
  const visible = await frame.evaluate(() => !!window.__hxdRoomMenuVisible || !!document.querySelector('.room-view'));
  if (visible) return out;
  try {
    const button = frame.locator('.game-view button[data-hook="menu"], button[data-hook="menu"]').first();
    if (await button.count()) {
      await button.click({ timeout: 3000 });
      out.attempted = true;
      out.button = true;
    }
  } catch (e) {
    out.buttonError = String(e && e.message || e);
  }
  await frame.waitForTimeout(400);
  return out;
}

async function runOnce(index) {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), `hxd-perf-${browserName}-${index}-`));
  const args = [
    `--disable-extensions-except=${EXTENSION_DIR}`,
    `--load-extension=${EXTENSION_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-features=Translate,BraveVPN,BraveRewards',
    '--disable-background-networking',
    '--autoplay-policy=no-user-gesture-required',
    '--window-size=1280,720',
  ];
  if (process.env.HXD_DISABLE_FRAME_LIMIT === '1') {
    args.push('--disable-frame-rate-limit');
  }

  const context = await chromium.launchPersistentContext(userDataDir, {
    executablePath,
    headless: !headed,
    viewport: { width: 1280, height: 720 },
    args,
  });

  const page = context.pages()[0] || await context.newPage();
  page.setDefaultTimeout(30000);
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  const summaries = [];
  let flow = {};
  try {
    await page.goto('https://www.haxball.com/play', { waitUntil: 'domcontentloaded', timeout: 45000 });
    let frame = await findGameFrame(page);
    await waitForGameReady(frame);
    await injectPerfProbe(frame);
    summaries.push(await phase(frame, 'welcome-idle', 1200));
    await clickOk(frame, `${nickPrefix}${Date.now().toString(36).slice(-5)}${index}`);
    await page.waitForTimeout(700);
    frame = await findGameFrame(page);
    summaries.push(await phase(frame, 'after-ok', phaseMs));
    try {
      await frame.waitForSelector('#hxd-roomlist-preview-root, .roomlist-view, .room-view, .game-view', { timeout: 30000 });
    } catch (e) {
      flow.waitAfterOkError = String(e && e.message || e);
    }
    summaries.push(await phase(frame, 'roomlist-idle', phaseMs));

    flow.room = await ensureRoomOrGame(frame, `Codex Perf ${Date.now().toString(36)}`);
    summaries.push(await phase(frame, 'room-after-create-or-wait', phaseMs));

    flow.menuToggle1 = await toggleMenu(frame);
    summaries.push(await phase(frame, 'menu-visible-1', phaseMs));
    flow.menuToggle2 = await toggleMenu(frame);
    summaries.push(await phase(frame, 'menu-toggle-2', phaseMs));
  } finally {
    await Promise.race([
      context.close().catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]);
    killProfileProcesses(userDataDir);
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
  }

  return {
    ok: true,
    index,
    browserName,
    executablePath,
    extensionDir: EXTENSION_DIR,
    frameLimitDisabled: process.env.HXD_DISABLE_FRAME_LIMIT === '1',
    flow,
    summaries,
    consoleErrors: consoleErrors.slice(0, 50),
  };
}

(async () => {
  const results = [];
  for (let i = 0; i < repeat; i++) {
    results.push(await runOnce(i + 1));
  }
  const failed = results.some((run) => run.summaries.some((s) => {
    const steady = !/^(welcome-idle|after-ok)$/.test(s.label || '');
    return s.pageErrors.length || s.localFailures.length ||
      (steady && (s.rafOver200 > 0 || s.longTaskMax > 250));
  }));
  const output = { ok: !failed, repeat, phaseMs, results };
  console.log(JSON.stringify(output, null, 2));
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: String(error && error.stack || error) }, null, 2));
  process.exit(1);
});
