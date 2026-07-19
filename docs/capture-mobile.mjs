/**
 * Captures des écrans de l'application mobile pour le manuel agent.
 *
 * L'application tourne sur PDA Zebra et n'a pas de version web : elle ne peut
 * donc pas être capturée comme les portails. Ce script rend à la place une
 * reproduction fidèle des écrans (docs/mobile-mock.html), construite à partir
 * des mêmes valeurs de thème que apps/mobile/src/theme.ts, au format téléphone.
 *
 * Il réutilise la même mécanique que capture.mjs : rendu headless via CDP,
 * capture haute densité, et export des coordonnées réelles des éléments pour
 * que les annotations du manuel tombent au bon endroit.
 *
 * Usage : node docs/capture-mobile.mjs
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'img');
const PORT = 9223; // distinct de capture.mjs, pour pouvoir lancer les deux
const VIEWPORT = { width: 390, height: 844 };
const SCALE = 3; // ecran de telephone : densite elevee pour rester net en PDF

const BROWSERS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Écrans à capturer, avec les repères à annoter sur chacun. */
const SCREENS = [
  ['mob_0_login', {
    email: { sel: '#f-email', label: 'Votre identifiant agent' },
    pass: { sel: '#f-pass', label: 'Votre mot de passe' },
    btn: { sel: '#f-btn', label: 'Ouvrir la session' },
  }],
  ['mob_1_vols', {
    vol: { sel: '#v-1', label: 'Choisissez votre vol' },
  }],
  ['mob_2_vol', {
    flight: { sel: '#w-flight', label: 'Le vol en cours' },
    stats: { sel: '#w-stats', label: 'Avancement du vol' },
    checkin: { sel: '#w-checkin', label: 'Poste Check-in' },
    bag: { sel: '#w-bag', label: 'Poste Bagages' },
    dolly: { sel: '#w-dolly', label: 'Poste Dolly' },
    rush: { sel: '#w-rush', label: 'Poste Rush' },
  }],
  ['mob_3_checkin', {
    head: { sel: '#c-head', label: 'Vol et poste en cours' },
    stage: { sel: '#c-stage', label: 'Zone de scan' },
    res: { sel: '#c-res', label: 'Dernier passager enregistré' },
  }],
  ['mob_4_bagages', {
    prog: { sel: '#b-prog', label: 'Bagages enregistrés sur le vol' },
    stage: { sel: '#b-stage', label: 'Zone de scan' },
    bad: { sel: '#b-bad', label: 'Bagage refusé' },
  }],
  ['mob_5_dolly', {
    head: { sel: '#d-head', label: 'Poste Dolly' },
    prog: { sel: '#d-prog', label: 'Progression du dolly' },
    res: { sel: '#d-res', label: 'Bagage accepté' },
  }],
  ['mob_6_soute', {
    avant: { sel: '#s-avant', label: 'Soute avant' },
    arriere: { sel: '#s-arriere', label: 'Soute arrière' },
  }],
  ['mob_7_charger', {
    info: { sel: '#g-info', label: 'Ordre des opérations' },
    btn: { sel: '#g-btn', label: 'Charger en une fois' },
  }],
  ['mob_8_embarquement', {
    prog: { sel: '#e-prog', label: 'Reste à embarquer' },
    res: { sel: '#e-res', label: 'Passager embarqué' },
  }],
];

class Cdp {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map();
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      const p = this.pending.get(m.id);
      if (p) { this.pending.delete(m.id); m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result); }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((res, rej) => {
      this.pending.set(id, { resolve: res, reject: rej });
      setTimeout(() => { if (this.pending.delete(id)) rej(new Error(`timeout ${method}`)); }, 30_000);
    });
  }
  async eval(expr) {
    const r = await this.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result?.value;
  }
  async shot(name, marks) {
    const { data } = await this.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    writeFileSync(join(OUT, `${name}.png`), Buffer.from(data, 'base64'));
    const rects = await this.eval(`(() => {
      const specs = ${JSON.stringify(marks)}; const out = {};
      for (const [k, s] of Object.entries(specs)) {
        const el = document.querySelector(s.sel);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (!r.width && !r.height) continue;
        out[k] = { x: Math.round(r.x * ${SCALE}), y: Math.round(r.y * ${SCALE}),
                   w: Math.round(r.width * ${SCALE}), h: Math.round(r.height * ${SCALE}), label: s.label };
      }
      return out;
    })()`);
    writeFileSync(join(OUT, `${name}.json`), JSON.stringify(rects, null, 2));
    const missing = Object.keys(marks).filter((k) => !(k in rects));
    console.log(`  ok ${name}.png (${Object.keys(rects).length} reperes)${missing.length ? ' | manquants: ' + missing.join(', ') : ''}`);
  }
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = BROWSERS.find((p) => existsSync(p));
  if (!browser) throw new Error('Edge ou Chrome introuvable');

  const proc = spawn(browser, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    `--remote-debugging-port=${PORT}`,
    `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
    '--user-data-dir=' + join(HERE, '.capture-profile-mobile'),
    'about:blank',
  ], { stdio: 'ignore' });

  try {
    for (let i = 0; i < 40; i++) {
      await sleep(400);
      try { await fetch(`http://127.0.0.1:${PORT}/json/version`); break; } catch {}
    }
    const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r, { once: true }));
    const cdp = new Cdp(ws);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: VIEWPORT.width, height: VIEWPORT.height, deviceScaleFactor: SCALE, mobile: true,
    });

    const url = 'file:///' + join(HERE, 'mobile-mock.html').replace(/\\/g, '/');
    await cdp.send('Page.navigate', { url });
    await sleep(1500);

    for (const [name, marks] of SCREENS) {
      const ok = await cdp.eval(`window.showScreen(${JSON.stringify(name)})`);
      if (!ok) { console.log(`  [!] ecran introuvable : ${name}`); continue; }
      await sleep(350);
      await cdp.shot(name, marks);
    }
    console.log(`\nCaptures ecrites dans ${OUT}`);
  } finally {
    proc.kill();
  }
}

main().catch((e) => { console.error('Echec :', e.message); process.exit(1); });
