/**
 * Captures d'écran des portails web pour les manuels d'utilisation.
 *
 * Pilote Edge/Chrome en headless via le Chrome DevTools Protocol (aucune
 * dépendance à installer : WebSocket natif de Node 22+). Permet de capturer des
 * écrans APRÈS interaction (ville choisie, formulaire rempli, session ouverte),
 * ce qu'une capture one-shot ne sait pas faire.
 *
 * Usage :
 *   node docs/capture.mjs            → écrans publics uniquement
 *   node docs/capture.mjs --login    → + écrans derrière authentification
 *
 * ⚠️ Aucun identifiant n'est stocké ici. Avec --login, l'email et le mot de
 *    passe sont demandés au terminal au moment de l'exécution, la frappe du
 *    mot de passe étant masquée : il ne passe pas par la ligne de commande et
 *    n'atterrit donc pas dans l'historique du shell.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'img');
const PORT = 9222;
const VIEWPORT = { width: 1440, height: 900 };
// Facteur de densité des captures : les rectangles mesurés en pixels CSS sont
// multipliés par ce facteur pour correspondre aux pixels réels de l'image.
const SCALE = 2;

const EDGE_CANDIDATES = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Pose une question au terminal. `hidden` masque la frappe : le mot de passe
 * ne s'affiche pas, ne passe pas par la ligne de commande et n'atterrit donc
 * ni dans l'historique du shell ni dans les variables d'environnement.
 */
function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = function (str) {
        // On ne réécrit que l'invite, jamais les caractères saisis.
        if (str.startsWith(question)) rl.output.write(question);
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      resolve(answer.trim());
    });
  });
}

function findBrowser() {
  const found = EDGE_CANDIDATES.find((p) => existsSync(p));
  if (!found) throw new Error('Edge ou Chrome introuvable');
  return found;
}

/** Client CDP minimal sur une cible page. */
class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      const p = this.pending.get(msg.id);
      if (p) {
        this.pending.delete(msg.id);
        msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result);
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.delete(id)) reject(new Error(`timeout ${method}`));
      }, 30_000);
    });
  }

  /** Évalue du JS dans la page et renvoie la valeur (sérialisable). */
  async eval(expr) {
    const r = await this.send('Runtime.evaluate', {
      expression: expr,
      awaitPromise: true,
      returnByValue: true,
    });
    // Une exception dans la page ne doit pas passer inaperçue : sans ça, un
    // sélecteur qui ne matche plus produit une capture du mauvais écran.
    if (r.exceptionDetails) {
      throw new Error(`JS page : ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`);
    }
    return r.result?.value;
  }

  /**
   * Variante tolérante : attend la condition mais n'échoue pas si elle n'est
   * jamais atteinte (un écran peut être légitimement vide). Sert à laisser aux
   * données le temps d'arriver avant la capture, sans casser toute la série.
   */
  async waitForSoft(expr, label, timeoutMs = 12_000) {
    try {
      await this.waitFor(expr, label, timeoutMs);
    } catch {
      console.log(`    … ${label} : rien à afficher, capture de l'écran vide`);
    }
  }

  /** Attend qu'une condition JS devienne vraie (plutôt qu'une pause fixe). */
  async waitFor(expr, label = expr, timeoutMs = 15_000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const ok = await this.eval(`!!(${expr})`).catch(() => false);
      if (ok) {
        await sleep(400); // laisse la peinture se stabiliser
        return;
      }
      await sleep(250);
    }
    throw new Error(`condition jamais atteinte : ${label}`);
  }

  async goto(url) {
    await this.send('Page.navigate', { url });
    // Attend que le rendu soit stable (Next.js hydrate côté client).
    for (let i = 0; i < 40; i++) {
      await sleep(250);
      const ready = await this.eval('document.readyState === "complete"').catch(() => false);
      if (ready) break;
    }
    await sleep(900);
  }

  /**
   * Capture l'écran et, si des repères sont fournis, exporte les coordonnées
   * réelles des éléments visés dans un JSON à côté de l'image. L'annotation
   * peut ainsi pointer exactement le bon bouton, au lieu de coordonnées
   * devinées qui se décalent au moindre changement de mise en page.
   */
  async shot(name, marks = null) {
    const { data } = await this.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const file = join(OUT, `${name}.png`);
    writeFileSync(file, Buffer.from(data, 'base64'));

    if (marks) {
      const rects = await this.eval(`(() => {
        const scale = ${SCALE};
        const specs = ${JSON.stringify(marks)};
        const out = {};
        for (const [key, spec] of Object.entries(specs)) {
          let el = null;
          if (spec.text) {
            el = [...document.querySelectorAll(spec.sel)]
              .find(e => e.textContent.trim().includes(spec.text)) ?? null;
          } else {
            el = document.querySelector(spec.sel);
          }
          if (!el) continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) continue;
          out[key] = {
            x: Math.round(r.x * scale), y: Math.round(r.y * scale),
            w: Math.round(r.width * scale), h: Math.round(r.height * scale),
            label: spec.label ?? '',
          };
        }
        return out;
      })()`);
      writeFileSync(join(OUT, `${name}.json`), JSON.stringify(rects, null, 2));
      const missing = Object.keys(marks).filter((k) => !(k in rects));
      if (missing.length) console.log(`    ⚠ repères introuvables : ${missing.join(', ')}`);
    }

    console.log(`  ✓ ${name}.png`);
    return file;
  }
}

async function connect() {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
  const targets = await res.json();
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  const cdp = new Cdp(ws);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: VIEWPORT.width,
    height: VIEWPORT.height,
    deviceScaleFactor: SCALE, // rendu net dans le PDF
    mobile: false,
  });
  return cdp;
}

// ─────────────────────────────────────────────────────────────
// Scénarios de capture, portail par portail
// ─────────────────────────────────────────────────────────────

const VOLS = 'http://localhost:3004';
const TRACKING = 'http://localhost:3002';
const WEB = 'http://localhost:3000';
const LITIGE = 'http://localhost:3003';

/** Étiquette réelle utilisée pour la démo de suivi (données masquées ensuite). */
const DEMO_TAG = '4071303821';

async function capturePublic(cdp) {
  console.log('\n▸ Portail VOLS');
  await cdp.goto(VOLS);
  await cdp.eval('localStorage.removeItem("vols.airport"); location.reload()');
  await cdp.waitFor(`document.querySelectorAll('.fl-city').length > 0`, 'sélecteur de ville affiché');
  await cdp.shot('vols_1_selecteur', {
    titre: { sel: 'h2', label: 'Choisissez votre aéroport' },
    domestique: { sel: 'h3', text: 'RD Congo', label: 'Lignes intérieures RDC' },
    ville: { sel: '.fl-city', text: 'Kinshasa', label: 'Cliquez sur votre ville' },
    international: { sel: 'h3', text: 'International', label: 'Lignes internationales' },
  });

  // Choix de Kinshasa → tableaux Départs / Arrivées
  await cdp.eval(`[...document.querySelectorAll('.fl-city')].find(b => b.textContent.includes('Kinshasa')).click()`);
  await cdp.waitFor(
    `[...document.querySelectorAll('h2')].some(h => h.textContent.trim() === 'Départs')`,
    'tableau Départs affiché',
  );
  await cdp.shot('vols_2_tableaux', {
    aeroport: { sel: 'header p', label: 'Aéroport sélectionné' },
    recherche: { sel: 'input', label: 'Rechercher un vol précis' },
    changer: { sel: 'button', text: 'Changer', label: 'Changer d’aéroport' },
    departs: { sel: 'h2', text: 'Départs', label: 'Vols au départ de votre ville' },
    arrivees: { sel: 'h2', text: 'Arrivées', label: 'Vols à destination de votre ville' },
    carte: { sel: 'li', label: 'Un vol : heure, numéro, route, statut' },
  });

  console.log('\n▸ Portail TRACKING');
  await cdp.goto(TRACKING);
  await cdp.waitFor(`document.querySelector('input')`, 'champ de recherche affiché');
  await cdp.shot('tracking_1_accueil', {
    titre: { sel: 'h1', label: 'Suivi de bagage, sans guichet' },
    champ: { sel: 'input', label: 'Saisissez votre PNR ou votre n° d’étiquette' },
    bouton: { sel: 'button', text: 'Suivre', label: 'Lancer la recherche' },
  });

  // Saisie d'une étiquette réelle → résultat du suivi
  await cdp.eval(`(() => {
    const i = document.querySelector('input');
    if (!i) return 'pas de champ';
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(i, '${DEMO_TAG}');
    i.dispatchEvent(new Event('input', { bubbles: true }));
    const form = i.closest('form');
    if (form) form.requestSubmit(); else i.closest('button,div')?.querySelector('button')?.click();
    return 'ok';
  })()`);
  // Attend l'affichage du résultat : l'étiquette recherchée apparaît dans la page.
  await cdp.waitFor(`document.body.innerText.includes('${DEMO_TAG}')`, 'résultat de suivi affiché');
  await cdp.shot('tracking_2_resultat', {
    resultat: { sel: 'h2, h3', label: 'Passager, vol et route' },
    statut: { sel: 'span', text: 'Enregistr', label: 'Étape atteinte par le bagage' },
    reclamation: { sel: 'button', text: 'réclamation', label: 'Ouvrir une réclamation' },
  });

  console.log('\n▸ Pages de connexion');
  // Une session laissée par une exécution précédente ferait rediriger /login
  // vers l'espace connecté : on repart d'un état déconnecté.
  await cdp.send('Network.enable');
  await cdp.send('Network.clearBrowserCookies');
  for (const origin of [WEB, LITIGE]) {
    await cdp.goto(origin);
    await cdp.eval('try { localStorage.clear(); sessionStorage.clear(); } catch {} true');
  }

  const loginMarks = {
    email: { sel: 'input[type=email]', label: 'Votre adresse email professionnelle' },
    motdepasse: { sel: 'input[type=password]', label: 'Votre mot de passe' },
    bouton: { sel: 'button[type=submit]', label: 'Se connecter' },
  };
  await cdp.goto(`${WEB}/login`);
  await cdp.waitFor(`document.querySelector('input[type=password]')`, 'formulaire de connexion web');
  await cdp.shot('web_0_login', loginMarks);
  await cdp.goto(`${LITIGE}/login`);
  await cdp.waitFor(`document.querySelector('input[type=password]')`, 'formulaire de connexion litige');
  await cdp.shot('litige_0_login', loginMarks);
}

async function login(cdp, baseUrl, email, password) {
  await cdp.goto(`${baseUrl}/login`);

  // Les cookies Supabase sont partagés entre les ports d'un même hôte : après
  // connexion sur un portail, les autres nous voient déjà authentifiés et
  // redirigent /login vers l'espace de travail. Pas de formulaire = déjà connecté.
  const hasForm = await cdp.eval(`!!document.querySelector('input[type=password], #password')`);
  if (!hasForm) {
    console.log('  (session déjà active — connexion inutile)');
    return;
  }

  const ok = await cdp.eval(`(() => {
    const set = (el, v) => {
      const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const email = document.querySelector('input[type=email], #email');
    const pass  = document.querySelector('input[type=password], #password');
    if (!email || !pass) return false;
    set(email, ${JSON.stringify(email)});
    set(pass, ${JSON.stringify(password)});
    (email.closest('form') || document.querySelector('form')).requestSubmit();
    return true;
  })()`);
  if (!ok) throw new Error(`formulaire de connexion introuvable sur ${baseUrl}`);
  if (!email || !password) {
    throw new Error(`session expirée sur ${baseUrl} — relancez avec --login`);
  }
  await sleep(4000);
}

async function captureAuth(cdp, email, password) {
  console.log('\n▸ Portail WEB (superviseur) — session ouverte');
  await login(cdp, WEB, email, password);

  // Chaque écran charge ses données après le rendu initial : sans attendre
  // qu'elles arrivent, on capture un tableau vide inutilisable dans un manuel.
  await cdp.goto(`${WEB}/dashboard`);
  await cdp.waitForSoft(`/ET\\s?\\d/.test(document.body.innerText)`, 'vols du jour chargés');
  await cdp.shot('web_1_dashboard', {
    navigation: { sel: 'nav', label: 'Navigation entre les espaces' },
    nouveau: { sel: 'button', text: 'Nouveau vol', label: 'Créer un vol du jour' },
    ecartes: { sel: 'div', text: 'Bagages écartés', label: 'Total des bagages refusés' },
    vol: { sel: 'button', text: 'ET', label: 'Ouvrir un vol pour voir son détail' },
  });

  await cdp.goto(`${WEB}/bagages`);
  await cdp.waitForSoft(`document.querySelectorAll('table, [class*=card]').length > 0`, 'bagages chargés');
  await cdp.shot('web_2_bagages', {
    titre: { sel: 'h1', label: 'Suivi des bagages' },
    filtres: { sel: 'input', label: 'Filtrer les bagages' },
  });

  await cdp.goto(`${WEB}/rapport`);
  await cdp.waitForSoft(`/ET\\s?\\d/.test(document.body.innerText)`, 'rapport chargé');
  await cdp.shot('web_3_rapport', {
    titre: { sel: 'h1', label: 'Rapports' },
    telecharger: { sel: 'button', text: 'Télécharger', label: 'Export Excel' },
  });

  await cdp.goto(`${WEB}/admin`);
  await cdp.waitForSoft(`/COMPTES/i.test(document.body.innerText)`, 'comptes chargés');
  await cdp.shot('web_4_admin', {
    creation: { sel: 'form', label: 'Créer un compte' },
    role: { sel: 'select', label: 'Choisir le rôle' },
    valider: { sel: 'button', text: 'Créer le compte', label: 'Valider la création' },
  });

  console.log('\n▸ Portail LITIGE — session ouverte');
  await login(cdp, LITIGE, email, password);
  await cdp.goto(`${LITIGE}/litiges`);
  await cdp.waitForSoft(`document.querySelectorAll('table, .bag-row').length > 0`, 'litiges chargés');
  await cdp.shot('litige_1_liste', {
    titre: { sel: 'h1', label: 'Dossiers de litige' },
    filtres: { sel: 'input', label: 'Filtrer les dossiers' },
  });
}

// ─────────────────────────────────────────────────────────────

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = findBrowser();
  const proc = spawn(browser, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    `--remote-debugging-port=${PORT}`,
    `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
    '--user-data-dir=' + join(HERE, '.capture-profile'),
    'about:blank',
  ], { stdio: 'ignore' });

  try {
    // Attend que le port de débogage réponde.
    for (let i = 0; i < 40; i++) {
      await sleep(400);
      try { await fetch(`http://127.0.0.1:${PORT}/json/version`); break; } catch {}
    }
    const cdp = await connect();

    // --auth-only : ne rejoue que les écrans authentifiés (les captures
    // publiques sont déjà faites), utile pour reprendre après un échec.
    if (!process.argv.includes('--auth-only')) {
      await capturePublic(cdp);
    }

    // Écrans derrière authentification. Avec --login on saisit les identifiants ;
    // avec --auth-only seul, on tente de réutiliser la session encore présente
    // dans le profil de capture (évite de ressaisir le mot de passe).
    const wantAuth = process.argv.includes('--login') || process.argv.includes('--auth-only');
    if (wantAuth) {
      let email = '';
      let password = '';
      if (process.argv.includes('--login')) {
        console.log('\n▸ Connexion superviseur (la frappe du mot de passe reste masquée)');
        email = await ask('  Email    : ');
        password = await ask('  Mot de passe : ', true);
        if (!email || !password) throw new Error('email et mot de passe requis');
      }
      await captureAuth(cdp, email, password);
    } else {
      console.log('\n⚠ Écrans derrière authentification non capturés.');
      console.log('  Pour les ajouter :  node docs/capture.mjs --login');
    }
    console.log(`\nCaptures écrites dans ${OUT}`);
  } finally {
    proc.kill();
  }
}

main().catch((e) => {
  console.error('Échec :', e.message);
  process.exit(1);
});
