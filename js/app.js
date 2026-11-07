// Student app: screens and routing. Rules live in engine.js; content lives in js/content/.
import { BLOCKS, OBJECTIVES, SKILLS, SKILL_ICON, SUPPORT, TRAPS } from "./content/curriculum.js";
import { WORLDS, PACKS } from "./content/worlds.js";
import { applyAnswer, mastery, nextBlock, nextDemand, nextSupport, rank, ranks, trapCounts, wrapping, mastered, dealSlots, placeOptions, seenCounts, freshest, quickGuesses, QUICK_MS } from "./engine.js";
import * as S from "./store.js";
import { DEMO } from "./config.js";
// Demo mode has the full content, answer key included. School mode loads the questions without the key:
// the server says whether each tap is right, so the key never reaches a student's device.
// One content pack per mission (island); they are merged here.
const LOADED = await Promise.all(PACKS.map(n => import(DEMO ? `./content/${n}.js` : `./content/${n}-public.js`)));
const GLOSSARY = Object.assign({}, ...LOADED.map(p => p.GLOSSARY));
const SOURCES = Object.assign({}, ...LOADED.map(p => p.SOURCES));
const ITEMS = LOADED.flatMap(p => p.ITEMS);
const MISSIONS = LOADED.map(p => p.MISSION);
const TRUST_CARDS = LOADED.find(p => p.TRUST_CARDS).TRUST_CARDS;
import { demoClass } from "./demo-class.js";
import { weeklyStreak, weekKey, gameXP } from "./kit/rewards.js";
import { play, soundUser, soundOn, setSound, say, canSpeak } from "./kit/sound.js";
import * as Cel from "./kit/celebrate.js";
import * as FX from "./kit/game-fx.js";
import { mountIsland } from "./kit/walker.js";
import { canBuzz, isIOS, buzzOn, setBuzz, buzz } from "./kit/haptics.js";

const $ = s => document.querySelector(s);
const app = $("#app");
const esc = t => String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ITEM = Object.fromEntries(ITEMS.map(i => [i.id, i]));
const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const totalXP = () => S.history().reduce((s, h) => s + (h.xp || 0), 0);
const support = () => S.profile().support;

/* ---------------- shell ---------------- */
function topbar() {
  const p = S.profile(), { streak } = weeklyStreak(S.history());
  return `<header class="top">
    <a href="#/" class="me-chip" aria-label="Home"><span class="av">${esc(p.avatar)}</span><b>${esc(p.nick)}</b></a>
    <span class="chip xp" title="Your XP">⭐ ${totalXP()}</span>
    <span class="chip" title="Weeks in a row with 2+ activities">🔥 ${streak}</span>
    <button class="icon" id="snd" aria-label="Sound on or off">${soundOn() ? "🔊" : "🔈"}</button>
  </header>`;
}
// Bottom tab bar: one thumb reaches everything on a phone.
const TABS = [["#/", "🗺️", "Map"], ["#/gym", "🏋️", "Gym"], ["#/game", "🕵️", "Game"], ["#/board", "🏆", "Ranks"], ["#/me", "🪪", "Me"]];
function tabbar() {
  const h = location.hash || "#/", now = h === "#/mission" || h === "#" ? "#/" : h;
  return `<nav class="tabs" aria-label="Main">${TABS.map(([href, ic, name]) =>
    `<a href="${href}" class="${now === href ? "on" : ""}" ${now === href ? 'aria-current="page"' : ""}><span aria-hidden="true">${ic}</span>${name}</a>`).join("")}</nav>`;
}
function page(html) {
  app.innerHTML = topbar() + `<main>${html}</main>` + tabbar();
  $("#snd").onclick = () => { setSound(!soundOn()); route(); };
  // Tapping the tab you are already on starts that screen again (the hash doesn't change, so call it directly).
  app.querySelectorAll(".tabs a").forEach(a => a.onclick = e => { if (a.getAttribute("href") === (location.hash || "#/")) { e.preventDefault(); route(); } });
  window.scrollTo(0, 0);
}
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const bring = el => el && el.scrollIntoView({ block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });

/* ---------------- sign in (demo) ---------------- */
function signIn() {
  const avatars = ["🦊", "🐼", "🐢", "🦉", "🐬", "🦋", "🐯", "🦜", "🐙", "🦔", "🐳", "🦎"];
  app.innerHTML = `<main class="signin">
    <h1>Global Visions</h1>
    <p class="lead">You are a field agent. Islands need your help. Check the facts, weigh the sources and make good decisions.</p>
    <div class="note">Demo mode: everything stays in this browser. Use a nickname, not your real name.</div>
    <label>Agent nickname <input id="nick" maxlength="16" autocomplete="off" placeholder="e.g. MangoComet"></label>
    <p class="label">Choose your agent</p>
    <div class="avatars">${avatars.map((a, i) => `<button class="av-pick${i ? "" : " on"}" data-a="${a}" aria-label="Avatar ${a}">${a}</button>`).join("")}</div>
    <p class="label">How much English help do you want?</p>
    <div class="levels">${SUPPORT.map((s, i) => `<label class="lv"><input type="radio" name="sup" value="${i}" ${i === 1 ? "checked" : ""}><b>${s.name}</b><span>${s.desc}</span></label>`).join("")}</div>
    <p class="small">You can change this any time. Help with English never costs XP.</p>
    <button class="btn big" id="go">Start</button>
    <p class="small sec">Teacher? <a href="teacher.html">Open the teacher view</a></p>
  </main>`;
  let av = avatars[0];
  app.querySelectorAll(".av-pick").forEach(b => b.onclick = () => { app.querySelectorAll(".av-pick").forEach(x => x.classList.remove("on")); b.classList.add("on"); av = b.dataset.a; play("tap"); });
  $("#go").onclick = () => {
    const nick = $("#nick").value.trim().replace(/\s+/g, "");
    if (nick.length < 2) { $("#nick").focus(); $("#nick").classList.add("err"); return; }
    S.signIn(nick, av); S.updateProfile({ support: +app.querySelector("input[name=sup]:checked").value });
    soundUser(nick); location.hash = "#/"; route();
  };
}

/* ---------------- sign in (school accounts) ---------------- */
let REMOTE = null;            // the server module once a student is signed in (real mode only)
// The answer key: in this browser in demo mode, on the server in school mode. Option numbers (k) are positions in
// the content's option list: data order in demo mode (0 = right), the public alphabetical order in school mode.
const KEY = {
  async order(it, slot) {
    if (DEMO) return placeOptions(it.options.map((o, k) => ({ ...o, k })), slot);
    return (await REMOTE.dealOptions(it.id)).map(k => ({ t: it.options[k].t, k }));
  },
  async check(it, k, ms, simplified) {
    if (!DEMO) return REMOTE.checkAnswer(it.id, k, ms, simplified);
    const o = it.options[k];
    return k === 0 ? { right: true, explain: it.explain } : { right: false, why: o.why, trap: o.trap, b: o.b };
  },
  // Sentence jumble: seq lists the sentences in the student's order (positions in the list as shown).
  // A wrong order says which place is wrong and what that place's job is, never which sentence goes there.
  async checkOrder(it, seq, ms) {
    if (!DEMO) return REMOTE.checkOrder(it.id, seq, ms);
    const pos = seq.findIndex((k, n) => k !== n);
    return pos < 0 ? { right: true, explain: it.explain } : { right: false, pos, why: it.parts[pos].why };
  },
  async cards() { return DEMO ? balancedCards().map(c => TRUST_CARDS.indexOf(c)) : REMOTE.dealCards(); },
  async card(idx, v) {
    if (!DEMO) return REMOTE.checkCard(idx, v);
    const c = TRUST_CARDS[idx], right = v === c.ok;
    return { right, why: c.why, trap: right ? null : c.trap };
  }
};
const offlineNote = `<p class="info">No connection. Check your internet, then try again.</p><button class="btn" id="retry">Try again</button>`;
window.addEventListener("online", () => S.flush());
window.addEventListener("gv-sync", () => { const c = document.querySelector(".chip.xp"); if (c) c.textContent = `⭐ ${totalXP()}`; });
// Used only when js/config.js has Supabase settings. Step 1: school Google account. Step 2: class code and nickname.
async function schoolSignIn() {
  const A = await import("./auth.js");
  const shell = html => { app.innerHTML = `<main class="signin"><h1>Global Visions</h1>${html}</main>`; };
  shell(`<p>Checking your account…</p>`);
  let acc;
  try { acc = await A.account(); } catch (e) { return shell(`<p class="note">Can't reach the server. Check your internet and reload.</p>`); }
  if (!acc) {
    shell(`<p class="lead">You are a field agent. Islands need your help.</p>
      <button class="btn big" id="google">Sign in with your school Google account</button>
      <p class="small">Use your school email. Other accounts can't join.</p>`);
    $("#google").onclick = () => A.signInWithGoogle();
    return;
  }
  if (!acc.ok) {
    await A.signOut();
    shell(`<p class="note">${esc(acc.email)} isn't a school account. Please sign in with your school email.</p>
      <button class="btn big" id="again">Try again</button>`);
    $("#again").onclick = () => schoolSignIn();
    return;
  }
  const m = await A.membership().catch(() => null);
  // Shared iPads: if this browser holds another student's practice, clear it before this student starts.
  if (m) {
    const p = S.profile(); if (!p || p.nick !== m.nick) { S.signOut(); S.signIn(m.nick, m.avatar); }
    S.setRemote({ save: A.saveAttempt, load: A.myAttempts });
    try { await S.loadRemote(); } catch (e) { /* offline: keep this device's copy */ }
    const set = await A.myClassSettings().catch(() => null); if (set) S.setTeacher(set);
    S.flush(); REMOTE = A;
    return route();
  }
  const avatars = ["🦊", "🐼", "🐢", "🦉", "🐬", "🦋", "🐯", "🦜", "🐙", "🦔", "🐳", "🦎"];
  shell(`<p class="lead">Welcome, agent. Join your class.</p>
    <label>Class code from your teacher <input id="code" maxlength="8" autocomplete="off" autocapitalize="characters" placeholder="e.g. HK7A24"></label>
    <label>Agent nickname <input id="nick" maxlength="16" autocomplete="off" placeholder="e.g. MangoComet"></label>
    <p class="small">Use a nickname, not your real name. Only nicknames appear on leaderboards.</p>
    <p class="label">Choose your agent</p>
    <div class="avatars">${avatars.map((a, i) => `<button class="av-pick${i ? "" : " on"}" data-a="${a}" aria-label="Avatar ${a}">${a}</button>`).join("")}</div>
    <p id="msg" class="note" hidden></p>
    <button class="btn big" id="join">Join class</button>
    <button class="link" id="out">Use a different account</button>`);
  let av = avatars[0];
  app.querySelectorAll(".av-pick").forEach(b => b.onclick = () => { app.querySelectorAll(".av-pick").forEach(x => x.classList.remove("on")); b.classList.add("on"); av = b.dataset.a; });
  $("#out").onclick = async () => { await A.signOut(); schoolSignIn(); };
  $("#join").onclick = async () => {
    $("#join").disabled = true;
    const r = await A.joinClass($("#code").value, $("#nick").value, av).catch(() => ({ error: "Something went wrong. Please try again." }));
    $("#join").disabled = false;
    if (r.error) { $("#msg").textContent = r.error; $("#msg").hidden = false; return; }
    schoolSignIn();
  };
}

/* ---------------- home: the archipelago ---------------- */
// The island the student is on: the one they chose on the map, if it's open, else the first open island with a mission.
const missionOf = worldId => MISSIONS.find(m => m.world === worldId);
const worldOf = M => WORLDS.find(w => w.id === M.world);
function currentMission() {
  const open = S.teacher().open, isOpen = m => open.includes(m.world);
  return MISSIONS.find(m => m.world === S.flags().isle && isOpen(m)) || MISSIONS.find(isOpen) || MISSIONS[0];
}
const phaseDone = (M, ph) => S.history().some(h => h.text_id === `${M.id}-${ph.kind}`);
const missionItems = M => M.phases.flatMap(ph => (ph.items || []).flat());
const missionSources = M => M.places.filter(p => p.source).map(p => p.source);
function missionProgress(M = currentMission()) {
  return M.phases.filter(ph => phaseDone(M, ph)).length / M.phases.length;
}
// Island health: 60% from finishing the mission, 40% from mastering the skill blocks it practises.
function islandHealth(world) {
  const M = missionOf(world.id); if (!M) return 0;
  const p = mastery(S.history()), blocks = [...new Set(missionItems(M).map(id => ITEM[id] && ITEM[id].block).filter(Boolean))];
  return Math.round(60 * missionProgress(M) + 40 * blocks.filter(b => mastered(p, b)).length / Math.max(1, blocks.length));
}
function home() {
  const open = S.teacher().open, M = currentMission(), W = worldOf(M), done = missionProgress(M);
  const nextPhase = M.phases.find(ph => !phaseDone(M, ph));
  const intro = S.profile().seenIntro ? "" : `<section class="card intro">
      <h3>Welcome, Agent ${esc(S.profile().nick)}!</h3>
      <ol><li><b>Do the mission</b> on an open island. Check sources and decide what to trust.</li>
        <li><b>Train in the Gym</b>. Questions get harder as you improve.</li>
        <li><b>Need help with English?</b> Tap <span class="gl">purple words</span> or 🔊. Help never costs XP.</li></ol>
      <p class="small">Tip: add this app to your home screen. iPhone: Share → Add to Home Screen. Android: menu ⋮ → Add to Home screen.</p>
      <button class="btn" id="introOk">Got it</button></section>`;
  page(`${intro}
    <section class="card isle-card"><p class="kicker">${W.icon} ${W.island} · tap a place to walk there</p>
      <div id="isle"></div>
      <div class="isle-go" id="isleGo" aria-live="polite"><p class="small">Tap a place to walk there. Find the ${missionSources(M).length} sources for your case file.</p></div></section>
    <section class="hero card">
      <p class="kicker">Today's mission · ${W.island}</p>
      <h2>${M.title}</h2>
      <p>${done >= 1 ? "Mission complete. Replay it, or train in the Think Gym." : `Next: ${nextPhase.title}`}</p>
      <div class="bar"><i style="width:${Math.round(done * 100)}%"></i></div>
      <a class="btn" href="#/mission">${done > 0 && done < 1 ? "Continue" : done >= 1 ? "Replay" : "Start mission"}</a>
    </section>
    <div class="tiles">
      <a class="tile wide" href="#/dojo"><span>🥋</span><b>Debate Dojo</b><small>Practise PEEL, rebuttals, openings</small></a>
      <a class="tile" href="#/gym"><span>🏋️</span><b>Think Gym</b><small>5 quick questions at your level</small></a>
      <a class="tile" href="#/game"><span>🕵️</span><b>Trust or Bust</b><small>Game: can you trust it?</small></a>
      <a class="tile" href="#/board"><span>🏆</span><b>Leaderboards</b><small>Nicknames only</small></a>
      <a class="tile" href="#/me"><span>🪪</span><b>Agent ID</b><small>Skills, traps, passport</small></a>
    </div>
    <h3 class="sec">The archipelago</h3>
    <p class="small">Tap an open island to sail there.</p>
    <div class="islands">${WORLDS.map(w => {
      const isOpen = open.includes(w.id) && missionOf(w.id), h = islandHealth(w), stamp = S.flags()[`stamp-${w.id}`], here = w.id === W.id;
      return `<${isOpen ? `button type="button" data-w="${w.id}" ${here ? 'aria-current="true"' : ""}` : "div"} class="island${isOpen ? "" : " locked"}${here ? " here" : ""}">
        <span class="ic">${w.icon}</span><b>${w.island}${here ? " 📍" : ""}</b><small>${w.challenge} · ${w.title}</small>
        ${isOpen ? `<div class="bar health" title="Island health"><i style="width:${h}%"></i></div><small>Island health ${h}%${stamp ? " · 🛂" : ""}</small>`
                 : `<small class="lock">🔒 Opens with ${w.challenge} (${w.weeks})</small>`}
      </${isOpen ? "button" : "div"}>`; }).join("")}</div>`);
  islandScene($("#isle"), $("#isleGo"), M);
  app.querySelectorAll(".island[data-w]").forEach(b => b.onclick = () => { S.setFlag("isle", b.dataset.w); MISSION_PLAN = null; home(); });
  const ok = $("#introOk"); if (ok) ok.onclick = () => { S.updateProfile({ seenIntro: true }); home(); };
}

/* ---------------- a question, at the student's support level ---------------- */
// Renders text with **glossary** words as buttons.
function richText(text, mode) {
  return esc(text).replace(/\*\*(.+?)\*\*/g, (m, w) => mode === "off" ? w : `<button class="gl" data-w="${w.toLowerCase()}">${w}</button>`).replace(/\n/g, "<br>");
}
// Who made a source and when comes AFTER its words, so students learn to read to the end before they judge it.
function sourceCard(id, wrap) {
  const s = SOURCES[id], text = s[wrap.text], words = [...text.matchAll(/\*\*(.+?)\*\*/g)].map(m => m[1].toLowerCase());
  return `<article class="source">
    <header><span class="sic">${s.icon}</span><div><b>${s.kind}</b></div>
      ${canSpeak ? `<button class="icon say" data-say="src" aria-label="Read aloud">🔊</button>` : ""}</header>
    <p>${richText(text, wrap.glossary)}</p>
    <p class="byline">🔎 By ${esc(s.author)} · ${s.year}</p>
    ${wrap.glossary === "shown" && words.length ? `<dl class="wordbox">${words.map(w => `<div><dt>${w}</dt><dd>${GLOSSARY[w] || ""}</dd></div>`).join("")}</dl>` : ""}
    ${wrap.glossary === "off" && words.length ? `<button class="link" id="wordhelp">Word help</button>` : ""}
  </article>`;
}

// Runs a list of items one after another. onAnswer(answer) after each; done(answers, help) at the end.
// One mission run: for each question slot, the version this student has seen least, plus one even spread of
// right-answer positions across all phases together. Made when the Briefing starts (or a replay starts).
let MISSION_PLAN = null;
function newMissionPlan(M) {
  const counts = seenCounts(S.history());
  const picks = Object.fromEntries(M.phases.map(p => [p.kind, (p.items || []).map(v => Array.isArray(v) ? freshest(v, counts) : v)]));
  const ids = Object.values(picks).flat(), deal = dealSlots(ids.length);
  MISSION_PLAN = { id: M.id, picks, slots: Object.fromEntries(ids.map((id, i) => [id, deal[i]])) };
  return MISSION_PLAN;
}
const missionPlan = M => MISSION_PLAN && MISSION_PLAN.id === M.id ? MISSION_PLAN : newMissionPlan(M);
function runItems(ids, { title, onDone, pick, slots: given } = {}) {
  const answers = []; let i = 0, help = 0;
  const box = document.createElement("div"); box.className = "runner";
  const nextId = () => pick ? pick(answers) : ids[i];
  const slots = given || dealSlots(pick ? ids : ids.length);   // where the right answer sits in each question: evenly spread
  async function show() {
    if (pick ? answers.length >= ids : i >= ids.length) return review();
    const id = nextId();
    if (!id) return review();
    const it = ITEM[id], level = support(), helpAtStart = help;
    if (it.kind === "order") return jumble(it);
    let wrap = wrapping(level), tries = 0, simplified = false, traps = [], gap = null;
    const picks = [];                       // every option tapped, by its position in the data (0 = right); the server re-checks these
    const shownAt = Date.now(); let ms = 0;  // time to the first tap, to spot quick guesses
    const total = pick ? ids : ids.length;
    let opts;                                // same order on every redraw
    try { opts = await KEY.order(it, slots[answers.length] ?? 0); }
    catch (e) { box.innerHTML = `<div class="card">${offlineNote}</div>`; box.querySelector("#retry").onclick = () => show(); return; }
    const wrongs = [];                       // the student's wrong choices and why, for the review
    function draw() {
      box.innerHTML = `<p class="kicker">${title || ""} · ${answers.length + 1} of ${total}</p>
        <div class="dots">${Array.from({ length: total }, (_, k) => `<i class="${k < answers.length ? (answers[k].support === "none" ? "ok" : answers[k].support === "hint" ? "mid" : "no") : k === answers.length ? "now" : ""}"></i>`).join("")}</div>
        ${it.source ? sourceCard(it.source, wrap) : ""}
        <div class="q card"><p class="stem">${richText(it.stem[wrap.stem], "off")}</p>
          ${canSpeak ? `<button class="icon say" data-say="q" aria-label="Read the question aloud">🔊</button>` : ""}
          <div class="opts">${opts.map(o => `<button class="opt${picks.includes(o.k) ? " wrong" : ""}" data-k="${o.k}" ${picks.includes(o.k) ? "disabled" : ""}>${esc(o.t)}</button>`).join("")}</div>
          <div class="fb" aria-live="polite"></div></div>`;
      box.querySelectorAll(".gl").forEach(b => b.onclick = () => { help++; play("info"); glossaryPop(b); });
      const wh = box.querySelector("#wordhelp"); if (wh) wh.onclick = () => { help++; wrap = { ...wrap, glossary: "tap" }; draw(); };
      box.querySelectorAll(".say").forEach(b => b.onclick = () => { help++; say(b.dataset.say === "src" ? SOURCES[it.source][wrap.text].replace(/\*\*/g, "") : it.stem[wrap.stem]); });
      box.querySelectorAll(".opt").forEach(b => b.onclick = () => choose(+b.dataset.k, b));
    }
    const settle = () => requestAnimationFrame(() => bring(box.querySelector(".fb").lastElementChild));
    let busy = false;
    async function choose(k, btn) {
      if (busy) return; busy = true;
      const fb = box.querySelector(".fb"), t = picks.length ? ms : Date.now() - shownAt;
      let r;
      try { r = await KEY.check(it, k, t, simplified); }
      catch (e) { busy = false; fb.innerHTML = `<p class="info">No connection. Check your internet and choose again.</p>`; settle(); return; }
      busy = false;
      if (r.locked) {
        finish({ support: "explained" }, `<p class="info">You've used your tries on this question for now. You'll meet this skill again in a new question.</p>`);
        return;
      }
      picks.push(k); if (picks.length === 1) ms = t;
      const o = { t: (opts.find(x => x.k === k) || {}).t, why: r.why, trap: r.trap, b: r.b };
      if (r.right) {
        play("ok"); btn.classList.add("right", "pop");
        const barrier = simplified && tries === 1 ? "language" : undefined;
        const sup = tries === 0 || barrier ? "none" : "hint";
        if (barrier) traps = [];           // a language miss is not a thinking trap
        finish({ support: sup, barrier }, `<p class="good">✔ ${tries === 0 ? "Right first time!" : barrier ? "Right! The English was the tricky part, not your thinking." : "Right!"}</p><p>${esc(r.explain || "")}</p><p class="skilltag">${skillLine(it)}</p>`);
        return;
      }
      play("bad"); btn.classList.add("wrong", "shake"); btn.disabled = true; tries++;
      wrongs.push({ t: o.t, why: o.why });
      if (o.trap) traps.push(o.trap); if (o.b) gap = o.b;
      if (tries === 1 && wrap.simpler && !simplified) {
        simplified = true; wrap = wrapping(1);
        fb.innerHTML = `<p class="bad">✘ ${esc(o.why || "That choice doesn't fit.")}</p><p class="info">Let's try the same question in simpler English.</p><button class="btn" id="cont">Say it simpler</button>`;
        box.querySelector("#cont").onclick = () => { draw(); box.scrollIntoView({ block: "start" }); }; settle(); return;
      }
      // A wrong tap always says why that choice doesn't work. The right answer is never shown,
      // so tapping wrong answers on purpose teaches nothing about which one is right.
      const why = `<p class="bad">✘ ${esc(o.why || "That choice doesn't fit.")}</p>`;
      if (tries === 1) {
        play("info");
        fb.innerHTML = `${why}<p class="info">💡 Hint: ${esc(it.hint)}</p>${o.trap && TRAPS[o.trap] ? `<p class="small">Watch out: <b>${TRAPS[o.trap].name}</b>. ${TRAPS[o.trap].tip}</p>` : ""}`;
        settle(); return;
      }
      // Out of tries (2 wrong taps): no reveal. The question counts as missed and won't earn XP again.
      box.querySelectorAll(".opt").forEach(b => b.disabled = true);
      finish({ support: "explained" }, `${why}<p class="info">Not this time. We won't show the answer: you'll meet this skill again in a new question.</p>${o.trap && TRAPS[o.trap] ? `<p class="small">Trap to watch: <b>${TRAPS[o.trap].name}</b>. ${TRAPS[o.trap].tip}</p>` : ""}`);
    }
    function finish(res, html) {
      box.querySelectorAll(".opt").forEach(b => b.disabled = true);
      wrapUp({ item: it.id, block: it.block, demand: it.demand, first_try: res.support === "none" && !res.barrier, ...res, traps, gap: res.support === "explained" ? gap : null, help: help - helpAtStart, picks, simplified, ms, wrongs }, html);
    }
    draw();
  }
  // Records one finished question and shows the Next button.
  function wrapUp(a, html) {
    answers.push(a); i++;
    // Two quick wrong first taps in one set: a gentle nudge to read first.
    const nudge = quickGuesses(answers) === 2 && a.picks[0] !== 0 && a.ms < QUICK_MS
      ? `<p class="note">🐢 Slow down, agent. Read the source and the question first. Quick guesses lower your progress and earn less XP.</p>` : "";
    const fb = box.querySelector(".fb");
    fb.innerHTML = nudge + html + `<button class="btn" id="next">${(pick ? answers.length >= ids : i >= ids.length) ? "Finish" : "Next"}</button>`;
    box.querySelector("#next").onclick = () => { show(); box.scrollIntoView({ block: "start" }); };
    box.querySelector("#next").focus({ preventScroll: true });
    requestAnimationFrame(() => bring(fb.lastElementChild));
  }
  // Sentence jumble: tap the sentences into order, then check. Two wrong checks, then move on without showing the order.
  // In demo mode the sentences are shown in the same alphabetical order as the school-mode file.
  function jumble(it) {
    const helpAtStart = help, wrap = wrapping(support()), total = pick ? ids : ids.length;
    const shown = (DEMO ? it.parts.map((p, k) => ({ t: p.t, k })).sort((a, b) => a.t.localeCompare(b.t, "en")) : it.parts.map((p, k) => ({ t: p.t, k })));
    const text = Object.fromEntries(shown.map(p => [p.k, p.t]));
    let chosen = [], tries = 0, busy = false, ms = 0, over = false, justPlaced = null, lastWrong = "";
    const results = [], wrongs = [], shownAt = Date.now();
    function draw(fbHTML = "") {
      const left = shown.filter(p => !chosen.includes(p.k));
      box.innerHTML = `<p class="kicker">${title || ""} · ${answers.length + 1} of ${total}</p>
        <div class="dots">${Array.from({ length: total }, (_, k) => `<i class="${k < answers.length ? (answers[k].support === "none" ? "ok" : answers[k].support === "hint" ? "mid" : "no") : k === answers.length ? "now" : ""}"></i>`).join("")}</div>
        ${it.source ? sourceCard(it.source, wrap) : ""}
        <div class="q card jumble"><p class="stem">🧩 ${richText(it.stem[wrap.stem], "off")}</p>
          ${canSpeak ? `<button class="icon say" data-say="q" aria-label="Read the question aloud">🔊</button>` : ""}
          <ol class="j-order" aria-label="Your order">${chosen.map(k => `<li><button class="jpart placed" data-k="${k}" ${over ? "disabled" : ""} aria-label="Remove: ${esc(text[k])}">${esc(text[k])}</button></li>`).join("")}
            ${Array.from({ length: shown.length - chosen.length }, () => `<li class="j-empty" aria-hidden="true"></li>`).join("")}</ol>
          ${left.length ? `<p class="small">Tap the sentence that comes ${chosen.length ? "next" : "first"}. Tap a placed sentence to take it back.</p>` : ""}
          <div class="j-pool">${left.map(p => `<button class="jpart" data-k="${p.k}" ${over ? "disabled" : ""}>${esc(p.t)}</button>`).join("")}</div>
          ${over ? "" : `<button class="btn" id="checkOrder" ${chosen.length < shown.length || chosen.join() === lastWrong ? "disabled" : ""}>Check my order</button>`}
          ${!over && lastWrong && chosen.join() === lastWrong ? `<p class="small">Change the order before you check again.</p>` : ""}
          <div class="fb" aria-live="polite">${fbHTML}</div></div>`;
      box.querySelectorAll(".say").forEach(b => b.onclick = () => { help++; say(b.dataset.say === "src" ? SOURCES[it.source][wrap.text].replace(/\*\*/g, "") : it.stem[wrap.stem]); });
      box.querySelectorAll(".gl").forEach(b => b.onclick = () => { help++; play("info"); glossaryPop(b); });
      box.querySelectorAll(".j-pool .jpart").forEach(b => b.onclick = () => { play("click"); chosen.push(+b.dataset.k); justPlaced = +b.dataset.k; draw(); });
      box.querySelectorAll(".j-order .jpart").forEach(b => b.onclick = () => { play("tap"); chosen = chosen.filter(k => k !== +b.dataset.k); draw(); });
      if (justPlaced !== null) { const el = box.querySelector(`.j-order .jpart[data-k="${justPlaced}"]`); if (el) el.classList.add("snap"); justPlaced = null; }
      const c = box.querySelector("#checkOrder"); if (c) c.onclick = check;
    }
    async function check() {
      if (busy) return; busy = true;
      const t = results.length ? ms : Date.now() - shownAt;
      let r;
      try { r = await KEY.checkOrder(it, chosen, t); }
      catch (e) { busy = false; box.querySelector(".fb").innerHTML = `<p class="info">No connection. Check your internet and try again.</p>`; return; }
      busy = false;
      const end = (sup, html) => { over = true; draw(); wrapUp({ item: it.id, block: it.block, demand: it.demand, first_try: sup === "none", support: sup, traps: [], gap: null, help: help - helpAtStart, picks: results, simplified: false, ms, wrongs }, html); };
      if (r.locked) return end("explained", `<p class="info">You've used your tries on this one for now. You'll meet this skill again in a new question.</p>`);
      results.push(r.right ? 0 : 1); if (results.length === 1) ms = t;
      if (r.right) { play("ok"); box.querySelector(".j-order").classList.add("solved"); return end(tries === 0 ? "none" : "hint", `<p class="good">✔ ${tries === 0 ? "Right first time!" : "Right!"}</p><p>${esc(r.explain || "")}</p><p class="skilltag">${skillLine(it)}</p>`); }
      play("bad"); tries++; lastWrong = chosen.join();
      const wrongEl = box.querySelectorAll(".j-order .jpart")[r.pos]; if (wrongEl) { wrongEl.classList.remove("shake"); void wrongEl.offsetWidth; wrongEl.classList.add("shake"); }
      const why = `<p class="bad">✘ Sentence ${r.pos + 1} isn't in the right place yet. ${esc(r.why || "")}</p>`;
      wrongs.push({ t: "Your sentence order", why: `Sentence ${r.pos + 1}: ${r.why || ""}` });
      if (tries === 1) { play("info"); draw(`${why}<p class="info">💡 Hint: ${esc(it.hint)}</p><p class="small">Move sentences by tapping them, then check again.</p>`); requestAnimationFrame(() => bring(box.querySelector(".fb").lastElementChild)); return; }
      // Out of tries: the right order is never shown.
      end("explained", `${why}<p class="info">Not this time. We won't show the order: you'll meet this skill again in a new jumble.</p>`);
    }
    draw();
  }
  // End-of-set review: the questions the student missed, with why each of their choices didn't work.
  // It never shows the right answer.
  function review() {
    const missed = answers.filter(a => a.support === "explained" && ITEM[a.item]);
    if (!missed.length) return onDone(answers, help);
    const wrap = wrapping(support());
    box.innerHTML = `<div class="card"><p class="kicker">Review</p><h3>Questions to learn from</h3>
      ${missed.map(a => { const it = ITEM[a.item]; return `<div class="sec"><p><b>${richText(it.stem[wrap.stem], "off")}</b></p>
        ${(a.wrongs || []).map(w => `<p class="opt wrong">${esc(w.t)}</p><p class="bad small">✘ ${esc(w.why || "")}</p>`).join("")}
        <p class="info">💡 ${esc(it.hint)}</p></div>`; }).join("")}
      <p class="small">We don't show the answers. These questions won't earn XP again, and a new version will test the same skill next time.</p>
      <button class="btn" id="reviewed">Continue</button></div>`;
    box.querySelector("#reviewed").onclick = () => onDone(answers, help);
    box.scrollIntoView({ block: "start" });
  }
  show();
  return box;
}
function skillLine(it) {
  const b = BLOCKS[it.block];
  return `${SKILL_ICON[b.skill]} ${b.skill}: ${b.name} <span class="code">${b.objectives.join(", ")}</span>`;
}
function glossaryPop(btn) {
  document.querySelectorAll(".pop-def").forEach(p => p.remove());
  const w = btn.dataset.w, d = document.createElement("span");
  d.className = "pop-def"; d.innerHTML = `<b>${esc(w)}</b>: ${esc(GLOSSARY[w] || "")}`;
  btn.after(d); if (canSpeak) say(`${w}. ${GLOSSARY[w] || ""}`);
  setTimeout(() => d.remove(), 6000);
}

// After a finished task: move the English support dial if the rules say so (a quiet note, never a celebration).
function afterTask(help) {
  const p = S.profile(), tasks = [...(p.tasks || []), { help }].slice(-5), r = nextSupport(p.support, tasks);
  S.updateProfile({ tasks: r.change ? [] : tasks, support: r.level });
  if (r.change && REMOTE) REMOTE.setSupport(r.level).catch(() => {});
  return r.change === "less" ? `<p class="note">You need less English help now, so texts will be a little longer. You can change this on your Agent ID.</p>`
       : r.change === "more" ? `<p class="note">Next time you'll get a little more English help. That's fine: the thinking is the same.</p>` : "";
}
function rankUps(before, after) {
  return SKILLS.filter(s => before[s] && after[s] && after[s].index > before[s].index).map(s => ({ skill: s, rank: after[s].name }));
}
function celebrate(xp, before, extraBig) {
  const ups = rankUps(before, ranks(mastery(S.history())));
  if (extraBig) Cel.big({ ...extraBig, xp });
  else if (ups.length) Cel.big({ icon: SKILL_ICON[ups[0].skill], title: `${ups[0].skill}: ${ups[0].rank}!`, sub: `New rank, Agent ${S.profile().nick}`, xp });
  else Cel.set(xp);
}

/* ---------------- the mission ---------------- */
function missionScreen() {
  const M = currentMission(), W = worldOf(M);
  const phase = M.phases.find(ph => !phaseDone(M, ph)) || null;
  if (!phase) return missionDone(M);
  const steps = M.phases.map(ph => `<li class="${phaseDone(M, ph) ? "done" : ph === phase ? "now" : ""}">${ph.title}</li>`).join("");
  const wrap = wrapping(support());
  page(`<p class="kicker">${W.island} · ${M.title}</p><ol class="phases">${steps}</ol><div id="stage"></div>`);
  const stage = $("#stage");
  if (phase.kind === "debrief") return debrief(stage, M);
  const intro = document.createElement("div");
  intro.className = "card brief";
  intro.innerHTML = phase.kind === "briefing"
    ? `<p class="kicker">${esc(M.from)}</p><p>${esc(M.brief[wrap.stem])}</p>${canSpeak ? `<button class="icon say" aria-label="Read aloud">🔊</button>` : ""}<button class="btn" id="begin">Accept mission</button>`
    : `<p class="kicker">${phase.icon || ""} ${esc(phase.title)}</p><p>${esc(phase.intro[wrap.stem])}</p><button class="btn" id="begin">${esc(phase.go || "Start")}</button>`;
  stage.appendChild(intro);
  const s = intro.querySelector(".say"); if (s) s.onclick = () => say(M.brief[wrap.stem]);
  intro.querySelector("#begin").onclick = () => {
    play("flip"); stage.innerHTML = "";
    const before = ranks(mastery(S.history()));
    const plan = phase.kind === "briefing" ? newMissionPlan(M) : missionPlan(M), ids = plan.picks[phase.kind];
    stage.appendChild(runItems(ids, { title: phase.title, slots: ids.map(id => plan.slots[id]), onDone: (answers, help) => {
      const att = S.saveAttempt({ id: `${M.id}-${phase.kind}`, mode: "mission", answers });
      const note = afterTask(help);
      stage.innerHTML = `<div class="card done"><h2>${phase.title} complete</h2><p>+${att.xp} XP</p>${note}<button class="btn" id="nextPhase">Next phase</button> <a class="btn ghost" href="#/">Map</a></div>`;
      $("#nextPhase").onclick = missionScreen;       // same hash, so call the screen directly
      celebrate(att.xp, before);
    } }));
  };
}
function debrief(stage, M) {
  const level = support(), frames = level <= 1;
  stage.innerHTML = `<div class="card"><p class="kicker">🪞 Debrief · Reflection</p>
    <p>${esc(M.debrief.intro)}</p>
    ${M.debrief.prompts.map((p, i) => `<label class="refl"><b>${esc(p.q)}</b>
      ${frames ? `<small>Try: ${esc(p.frame)}</small>` : ""}
      <textarea id="r${i}" rows="3" placeholder="${frames ? esc(p.frame) : ""}"></textarea></label>`).join("")}
    <button class="btn" id="saveR">Finish mission</button><p class="small" id="rmsg"></p></div>`;
  $("#saveR").onclick = () => {
    const texts = M.debrief.prompts.map((_, i) => $(`#r${i}`).value.trim());
    if (texts.filter(t => t.length >= 8).length < 2) { $("#rmsg").textContent = "Write at least two answers. One sentence each is fine."; return; }
    const before = ranks(mastery(S.history()));
    const answers = texts.map((t, i) => ({ item: `${M.id}-refl-${i}`, block: M.debrief.block, reflection: true, text: t, support: "none", help: 0 }));
    const att = S.saveAttempt({ id: `${M.id}-debrief`, mode: "mission", answers, bonus: 50 });
    S.setFlag(`stamp-${M.world}`, true);
    afterTask(0);
    celebrate(att.xp, before, { icon: "🛂", title: `Mission complete, ${S.profile().nick}!`, sub: M.stamp });
    missionDone(M);
  };
}
function missionDone(M) {
  const W = worldOf(M);
  page(`<div class="card done"><p class="kicker">${W.island} · ${M.title}</p><h2>Mission complete 🛂</h2>
    <p>${esc(M.done)} ${W.island}'s health is ${islandHealth(W)}%.</p>
    <p class="bring">🏠 ${esc(M.bringItHome)}</p>
    <a class="btn" href="#/gym">Train in the Think Gym</a> <button class="btn ghost" id="replay">Replay mission</button></div>`);
  $("#replay").onclick = () => { S.setFlag("replay", Date.now()); replayMission(M); };
}
function replayMission(M) {
  // Replay runs all question phases in one go (replay XP rules apply: half today, then nothing).
  const plan = newMissionPlan(M), items = Object.values(plan.picks).flat();
  page(`<p class="kicker">Replay · ${M.title}</p><div id="stage"></div>`);
  const before = ranks(mastery(S.history()));
  $("#stage").appendChild(runItems(items, { title: "Replay", slots: items.map(id => plan.slots[id]), onDone: (answers, help) => {
    const att = S.saveAttempt({ id: `${M.id}-replay`, mode: "mission", answers });
    const note = afterTask(help);
    $("#stage").innerHTML = `<div class="card done"><h2>Replay complete</h2><p>+${att.xp} XP${att.xp === 0 ? " (replays pay half the first time each day, then nothing)" : ""}</p>${note}<a class="btn" href="#/">Map</a></div>`;
    celebrate(att.xp, before);
  } }));
}

/* ---------------- Think Gym: adaptive practice ---------------- */
// Skills with enough questions to train (at least 6), in the curriculum's order.
const GYM_SKILLS = SKILLS.filter(s => ITEMS.filter(i => BLOCKS[i.block].skill === s).length >= 6);
function gym() {
  const skill = GYM_SKILLS.includes(S.profile().gymSkill) ? S.profile().gymSkill : GYM_SKILLS[0];
  const p = mastery(S.history()), blockNow = nextBlock(p, skill);
  page(`<div class="card"><p class="kicker">🏋️ Think Gym · ${skill}</p>
    <div class="seg${GYM_SKILLS.length === 3 ? " three" : ""}" role="group" aria-label="Skill to train">${GYM_SKILLS.map(s => `<button class="segb${s === skill ? " on" : ""}" data-skill="${s}">${SKILL_ICON[s]} ${s}</button>`).join("")}</div>
    <p>Five questions picked for you. Get two right first time in a row and they get harder.</p>
    <p class="small">Focus now: <b>${BLOCKS[blockNow].name}</b></p><button class="btn" id="go">Start</button></div><div id="stage"></div>`);
  app.querySelectorAll("[data-skill]").forEach(b => b.onclick = () => { S.updateProfile({ gymSkill: b.dataset.skill }); gym(); });
  $("#go").onclick = () => {
    $("#go").closest(".card").remove();
    const live = { ...p }, seen = new Set(), before = ranks(p), counts = seenCounts(S.history());
    let demand = S.profile().gymDemand || 0;
    const pick = answers => {
      if (answers.length) { applyAnswer(live, answers[answers.length - 1]); demand = nextDemand(demand, answers); }
      const b = nextBlock(live, skill);
      const pool = ITEMS.filter(i => BLOCKS[i.block].skill === skill && !seen.has(i.id));
      // Least-seen questions first, then the closest to the right difficulty.
      const order = (x, y) => ((counts[x.id] || 0) - (counts[y.id] || 0)) || (Math.abs(x.demand - demand) - Math.abs(y.demand - demand)) || (Math.random() - 0.5);
      const best = pool.filter(i => i.block === b).sort(order)[0] || pool.sort(order)[0];
      if (best) seen.add(best.id); return best && best.id;
    };
    $("#stage").appendChild(runItems(5, { title: "Think Gym", pick, onDone: (answers, help) => {
      S.updateProfile({ gymDemand: demand });
      const att = S.saveAttempt({ id: `gym-${new Date().toISOString().slice(0, 16)}`, mode: "practice", answers });
      const note = afterTask(help), right = answers.filter(a => a.support === "none").length;
      $("#stage").innerHTML = `<div class="card done"><h2>Workout done</h2><p>${right} of 5 right first time · +${att.xp} XP</p>${note}<button class="btn" id="again">Again</button> <a class="btn ghost" href="#/me">See my skills</a></div>`;
      $("#again").onclick = gym;
      celebrate(att.xp, before);
    } }));
  };
}

/* ---------------- Debate Dojo: quick rounds on framing an argument ---------------- */
// For debate week: PEEL points, rebuttals, openings and closings, with sentence jumbles mixed in.
// Each round spreads its 8 questions across the three blocks, weakest block first, least-seen questions first,
// and the difficulty steps up after two right first time (like the Think Gym). Saved as practice, so the
// same XP rules apply (seen questions earn nothing again).
const DOJO_BLOCKS = ["M4", "M5", "M6"], DOJO_N = 8;
function dojo() {
  const p = mastery(S.history());
  page(`<div class="card dojo"><p class="kicker">🥋 Debate Dojo</p><h2>Frame your argument</h2>
    <p>${DOJO_N} quick rounds to get ready for the debate. Sort sentences, fix jumbled speeches and pick the strongest rebuttal.</p>
    <div class="dojo-blocks">${DOJO_BLOCKS.map(b => `<div class="blk"><span>${esc(BLOCKS[b].name)}</span>
      <div class="bar ${mastered(p, b) ? "full" : ""}"><i style="width:${Math.round(Math.min(1, p[b] / 0.85) * 100)}%"></i></div></div>`).join("")}</div>
    <p class="small">Remember: <b>PEEL</b> = Point, Evidence, Explain, Link. <b>Rebuttal</b> = They said, However, Because, So.</p>
    <button class="btn" id="go">Start a round</button></div><div id="stage"></div>`);
  $("#go").onclick = () => {
    $("#go").closest(".card").remove();
    const live = { ...p }, seen = new Set(), before = ranks(p), counts = seenCounts(S.history()), used = {};
    let demand = S.profile().dojoDemand || 0;
    const pick = answers => {
      if (answers.length) { applyAnswer(live, answers[answers.length - 1]); demand = nextDemand(demand, answers); }
      const b = [...DOJO_BLOCKS].sort((x, y) => ((used[x] || 0) - (used[y] || 0)) || ((live[x] || 0) - (live[y] || 0)))[0];
      const pool = ITEMS.filter(i => DOJO_BLOCKS.includes(i.block) && !seen.has(i.id));
      const order = (x, y) => ((counts[x.id] || 0) - (counts[y.id] || 0)) || (Math.abs(x.demand - demand) - Math.abs(y.demand - demand)) || (Math.random() - 0.5);
      const best = pool.filter(i => i.block === b).sort(order)[0] || pool.sort(order)[0];
      if (best) { seen.add(best.id); used[best.block] = (used[best.block] || 0) + 1; }
      return best && best.id;
    };
    $("#stage").appendChild(runItems(DOJO_N, { title: "Debate Dojo", pick, onDone: (answers, help) => {
      S.updateProfile({ dojoDemand: demand });
      const att = S.saveAttempt({ id: `dojo-${new Date().toISOString().slice(0, 16)}`, mode: "practice", answers });
      const note = afterTask(help), right = answers.filter(a => a.support === "none").length;
      let run = 0, streak = 0; answers.forEach(a => { run = a.support === "none" ? run + 1 : 0; streak = Math.max(streak, run); });
      $("#stage").innerHTML = `<div class="card done"><h2>Round done 🥋</h2><p>${right} of ${answers.length} right first time · best streak ${streak} · +${att.xp} XP</p>${note}
        <button class="btn" id="again">Another round</button> <a class="btn ghost" href="#/me">See my skills</a></div>`;
      $("#again").onclick = dojo;
      celebrate(att.xp, before);
    } }));
  };
}

/* ---------------- Trust or Bust: game ---------------- */
// 4 Trust and 4 Bust cards in a mixed order, never 3 of the same answer in a row. Cards seen least come first.
function balancedCards() {
  const counts = seenCounts(S.history()), seen = c => counts[`trust-${TRUST_CARDS.indexOf(c)}`] || 0;
  const pickN = ok => shuffle(TRUST_CARDS.filter(c => c.ok === ok)).sort((a, b) => seen(a) - seen(b)).slice(0, 4);
  const yes = pickN(true), no = pickN(false);
  return dealSlots(yes.length + no.length, 2).map(s => (s ? yes : no).pop()).filter(Boolean);
}
function game() {
  const timed = support() >= 2;
  page(`<div class="card"><p class="kicker">🕵️ Trust or Bust</p><p>Can this source be trusted? Tap <b>Trust</b> or <b>Bust</b>. Streaks build a combo.</p>
    <p class="small">${timed ? "Each card has 8 seconds." : "No timer at your support level."} Games give up to 30 XP a day.</p>
    <div class="arena" id="arena"><div class="ghud"><span class="hchip pts">Points <b id="gpts">0</b></span><span class="hchip combo" id="gcombo" hidden></span><span class="hchip" id="gleft"></span></div>
    <div id="gcard" class="gcard"></div></div></div>`);
  const arena = $("#arena"), answers = [];
  let cards = [], i = 0, pts = 0, combo = 0, timer = null, busy = false;
  const draw = () => {
    clearTimeout(timer);
    if (!arena.isConnected) return;                 // the student left the game: stop quietly
    if (i >= cards.length) return end();
    const c = cards[i]; $("#gleft").textContent = `${i + 1}/${cards.length}`;
    $("#gcard").innerHTML = `<p class="gt">${esc(c.t)}</p><p class="gd">${esc(c.d || "")}</p><div class="tb"><button class="btn trust" data-v="1">👍 Trust</button><button class="btn bust" data-v="0">🚫 Bust</button></div><p class="gwhy"></p>`;
    $("#gcard").querySelectorAll("button").forEach(b => b.onclick = e => answer(+b.dataset.v === 1, e));
    if (timed) timer = setTimeout(() => answer(null), 8000);
  };
  const answer = async (v, e) => {
    clearTimeout(timer);
    if (!arena.isConnected || busy) return;
    const c = cards[i], pt = e ? [e.clientX, e.clientY] : null;
    busy = true; let res;
    try { res = await KEY.card(c.idx, v); }
    catch (err) { busy = false; $("#gcard .gwhy").textContent = "No connection. Check your internet and choose again."; return; }
    busy = false;
    if (!arena.isConnected) return;
    const ok = res.right, r = arena.getBoundingClientRect();
    const x = pt ? pt[0] - r.left : r.width / 2, y = pt ? pt[1] - r.top : r.height / 2;
    if (ok) { combo++; const g = 100 + 20 * (combo - 1); pts += g; FX.flash(arena); FX.burst(arena, x, y); FX.floatText(arena, x, y, `+${g}`); }
    else { combo = 0; FX.hurt(arena); FX.floatText(arena, x, y, v === null ? "Time!" : "Oops", "bad"); }
    FX.setPoints(arena, pts); FX.setCombo(arena, combo);
    answers.push({ item: `trust-${c.idx}`, game: true, v, support: ok ? "none" : "explained", traps: !ok && res.trap ? [res.trap] : [] });
    $("#gcard").querySelectorAll("button").forEach(b => b.disabled = true);
    $("#gcard .gwhy").innerHTML = `${ok ? "✔" : "✘"} ${esc(res.why)}`;
    i++; setTimeout(draw, ok ? 1300 : 2400);
  };
  const end = () => {
    const xp = gameXP(pts, S.history());
    S.saveGame({ id: "game-trust", xp, answers });
    $("#gcard").innerHTML = `<h2>${pts} points</h2><p>${answers.filter(a => a.support === "none").length} of ${cards.length} right · +${xp} XP</p><button class="btn" id="again">Play again</button> <a class="btn ghost" href="#/">Map</a>`;
    $("#again").onclick = game;
    if (xp) Cel.set(xp); else play("done");
  };
  KEY.cards().then(ix => {
    cards = ix.map(idx => ({ ...TRUST_CARDS[idx], idx }));
    FX.countdown(arena, () => arena.isConnected && draw());
  }).catch(() => { $("#gcard").innerHTML = offlineNote; $("#retry").onclick = game; });
}

/* ---------------- the island map: walk the agent between places ---------------- */
// The Map screen shows the current island in 3D. Students tap a place and their agent walks there, then they go in.
// One place holds the mission; the sources can be found where they come from and go into the case file.
// Answering questions stays a plain tap: the walking is only for getting around. Places come from each mission's
// content (MISSION.places). Everything here is fictional.
function islandScene(host, goBox, M) {
  const found = S.flags().found || [], done = missionProgress(M), sources = missionSources(M);
  const next = M.phases.find(ph => !phaseDone(M, ph));
  const SPOTS = M.places.map(p => p.mission ? { ...p, go: "#/mission" } : p);
  host.className = `isle-${M.world}`;
  const posKey = `pos-${M.world}`, start = S.flags()[posKey] || (M.world === "harvest" && S.flags().pos) || { x: 50, y: 40 };
  const isle = mountIsland(host, { spots: SPOTS, avatar: esc(S.profile().avatar), start,
    onMove: p => S.setFlag(posKey, { x: Math.round(p.x), y: Math.round(p.y) }), onArrive: arrive });
  SPOTS.forEach(sp => {
    const el = host.querySelector(`.place[data-id="${sp.id}"]`);
    if (sp.source && found.includes(sp.source)) el.classList.add("done");
    if (sp.mission) { el.classList.toggle("next", done < 1); el.classList.toggle("done", done >= 1); }
  });
  function arrive(sp) {
    play("tap");
    const text = sp.mission ? (done >= 1 ? "Mission complete. Replay it?" : `Your mission starts here. Next: ${next.title}.`)
      : sp.source ? (found.includes(sp.source) ? "Already in your case file." : "There's a source here. Collect it for your case file.") : sp.say;
    goBox.innerHTML = `<p><b>${esc(sp.name)}</b><br><span class="small">${esc(text)}</span></p><button class="btn" id="goin">Go in</button>`;
    $("#goin").onclick = () => sp.go ? (location.hash = sp.go) : openSource(sp);
    $("#goin").focus({ preventScroll: true });
  }
  function openSource(sp) {
    const f = S.flags().found || [], wrap = wrapping(support()), src = SOURCES[sp.source];
    if (!f.includes(sp.source)) { S.setFlag("found", [...f, sp.source]); play("ok"); }
    host.querySelector(`.place[data-id="${sp.id}"]`).classList.add("done");
    goBox.innerHTML = `<div>${sourceCard(sp.source, wrap)}
      <p class="small">✔ In your case file (${(S.flags().found || []).filter(x => sources.includes(x)).length} of ${sources.length}). Who made it, and why? You'll meet it in the mission.</p>
      <button class="btn ghost" id="closecard">Keep exploring</button></div>`;
    goBox.querySelectorAll(".gl").forEach(b => b.onclick = () => { play("info"); glossaryPop(b); });
    const sayb = goBox.querySelector(".say"); if (sayb) sayb.onclick = () => say(src[wrap.text].replace(/\*\*/g, ""));
    const wh = goBox.querySelector("#wordhelp"); if (wh) wh.onclick = () => { goBox.querySelector(".source p").innerHTML = richText(src[wrap.text], "tap"); wh.remove(); goBox.querySelectorAll(".gl").forEach(b => b.onclick = () => glossaryPop(b)); };
    $("#closecard").onclick = () => { goBox.innerHTML = `<p class="small">Tap a place to walk there.</p>`; };
  }
  const here = isle.here(); if (here) arrive(here);
  return isle;
}

/* ---------------- leaderboards ---------------- */
function board() {
  const t = S.teacher().boards;
  // School mode: the server works out every student's XP and mastery, so nobody can fake their place.
  if (REMOTE) {
    page(`<h2>Leaderboards</h2><p>Loading your class…</p>`);
    REMOTE.classBoard().then(rows => {
      if (location.hash !== "#/board") return;
      drawBoard(t, rows.map(r => ({ nick: r.nick, avatar: r.avatar, me: r.me, weekXP: r.week_xp, climbed: r.climbed, mastered: r.mastered })));
    }).catch(() => page(`<h2>Leaderboards</h2><p class="card">Couldn't load the leaderboards. Check your connection and try again.</p>`));
    return;
  }
  const me = S.profile(), hist = S.history(), wk = weekKey(new Date());
  const myWeek = hist.filter(h => weekKey(h.created_at) === wk).reduce((s, h) => s + h.xp, 0);
  const before = mastery(hist.filter(h => weekKey(h.created_at) !== wk)), now = mastery(hist);
  const myClimb = Object.keys(BLOCKS).filter(b => mastered(now, b) && !mastered(before, b)).length;
  const rows = [...demoClass().map(c => ({ ...c, mastered: Object.values(c.p).filter(v => v >= 0.85).length })),
    { nick: me.nick, avatar: me.avatar, weekXP: myWeek, climbed: myClimb, me: true, mastered: Object.keys(BLOCKS).filter(b => mastered(now, b)).length }];
  drawBoard(t, rows);
}
function drawBoard(t, rows) {
  const list = (arr, val, unit) => `<ol class="lb">${arr.slice(0, 10).map((r, i) => `<li class="${r.me ? "me" : ""}"><span class="pos">${i + 1}</span><span>${esc(r.avatar)} ${esc(r.nick)}</span><b>${r[val]} ${unit}</b></li>`).join("")}</ol>`;
  const week = [...rows].sort((a, b) => b.weekXP - a.weekXP), climb = [...rows].sort((a, b) => b.climbed - a.climbed);
  const meWeekPos = week.findIndex(r => r.me) + 1, myWeek = meWeekPos ? week[meWeekPos - 1].weekXP : 0;
  const classHealth = rows.length ? Math.round(rows.reduce((s, r) => s + r.mastered, 0) / (rows.length * Object.keys(BLOCKS).length) * 100) : 0;
  page(`<h2>Leaderboards</h2><p class="small">Nicknames only. The weekly board resets every Monday, so anyone can win.</p>
    ${t.island ? `<section class="card"><h3>🏝️ Class goal: restore ${worldOf(currentMission()).island}</h3><p>Every block anyone in the class masters helps.</p><div class="bar health"><i style="width:${classHealth}%"></i></div><p class="small">${classHealth}% restored</p></section>` : ""}
    ${t.week ? `<section class="card"><h3>⭐ This week's XP</h3>${list(week, "weekXP", "XP")}${meWeekPos > 10 ? `<p class="small">You: #${meWeekPos} with ${myWeek} XP</p>` : ""}</section>` : ""}
    ${t.climbers ? `<section class="card"><h3>🧗 Skill climbers</h3><p class="small">Blocks mastered this week. Growth, not just top scores.</p>${list(climb, "climbed", "blocks")}</section>` : ""}
    ${!t.week && !t.climbers && !t.island ? `<p class="card">Your teacher has turned the leaderboards off for now.</p>` : ""}`);
}

/* ---------------- Agent ID: skills, traps, passport, settings ---------------- */
function me() {
  const p = mastery(S.history()), r = ranks(p), traps = trapCounts(S.history()).slice(0, 3), prof = S.profile();
  page(`<section class="card idcard"><span class="av big">${esc(prof.avatar)}</span><div><p class="kicker">Agent ID</p><h2>${esc(prof.nick)}</h2><p>⭐ ${totalXP()} XP · 🛂 ${WORLDS.filter(w => S.flags()[`stamp-${w.id}`]).length} stamps</p></div></section>
    <h3 class="sec">My six skills</h3>
    <div class="skills">${SKILLS.map(s => {
      const rk = r[s], blocks = Object.keys(BLOCKS).filter(b => BLOCKS[b].skill === s);
      return `<section class="card skill"><h4>${SKILL_ICON[s]} ${s} ${rk ? `<span class="rank">${rk.name}</span>` : ""}</h4>
        ${rk ? blocks.map(b => `<div class="blk"><span>${BLOCKS[b].name} <small class="code">${BLOCKS[b].objectives.join(", ")}</small></span>
          <div class="bar ${mastered(p, b) ? "full" : ""}"><i style="width:${Math.round(Math.min(1, p[b] / 0.85) * 100)}%"></i></div></div>`).join("")
          : `<p class="small">Opens with later islands.</p>`}</section>`; }).join("")}</div>
    <h3 class="sec">Traps that catch me</h3>
    <section class="card">${traps.length ? traps.map(([t, n]) => `<p><b>${TRAPS[t].name}</b> ×${n}<br><small>${TRAPS[t].tip}</small></p>`).join("") : `<p class="small">No traps yet. Keep going!</p>`}</section>
    <h3 class="sec">Passport</h3>
    <section class="card stamps">${WORLDS.map(w => `<span class="stamp${S.flags()[`stamp-${w.id}`] ? " got" : ""}" title="${w.island}">${w.icon}</span>`).join("")}</section>
    <h3 class="sec">English help</h3>
    <section class="card"><div class="levels">${SUPPORT.map((s, i) => `<label class="lv"><input type="radio" name="sup" value="${i}" ${i === prof.support ? "checked" : ""}><b>${s.name}</b><span>${s.desc}</span></label>`).join("")}</div>
    <p class="small">The app also adjusts this for you. More help never costs XP.</p></section>
    <h3 class="sec">Text size</h3>
    <section class="card"><div class="seg">${[["Normal", false], ["Large", true]].map(([n, v]) => `<button class="segb${!!prof.bigText === v ? " on" : ""}" data-big="${v}">${n}</button>`).join("")}</div></section>
    <h3 class="sec">Vibration</h3>
    <section class="card"><div class="seg">${[["On", true], ["Off", false]].map(([n, v]) => `<button class="segb${buzzOn() === v ? " on" : ""}" data-buzz="${v}">${n}</button>`).join("")}</div>
    <p class="small">${isIOS ? "iPhone: a light tick when you tap (iOS 18 or later, Safari). It may not work on every iPhone, and iPads have no vibration motor." : canBuzz ? "A short buzz when you tap, get it right or get it wrong." : "This device or browser can't vibrate for web apps. Everything else works the same."}</p></section>
    <h3 class="sec">Colours</h3>
    <section class="card"><div class="seg three">${[["Auto", "auto"], ["Light", "light"], ["Dark", "dark"]].map(([n, v]) => `<button class="segb${(prof.theme || "light") === v ? " on" : ""}" data-theme="${v}">${n}</button>`).join("")}</div>
    <p class="small">Light is the default. Auto follows your phone's setting.</p></section>
    ${DEMO ? `<p><a class="btn ghost" href="teacher.html">Teacher view (demo)</a></p>` : ""}
    <button class="btn ghost" id="out">${DEMO ? "Sign out and reset demo" : "Sign out"}</button>`);
  app.querySelectorAll("[data-theme]").forEach(b => b.onclick = () => { S.updateProfile({ theme: b.dataset.theme }); applyText(); me(); });
  app.querySelectorAll("[data-buzz]").forEach(b => b.onclick = () => { setBuzz(b.dataset.buzz === "true"); play("tap"); me(); });
  app.querySelectorAll("[data-big]").forEach(b => b.onclick = () => { S.updateProfile({ bigText: b.dataset.big === "true" }); applyText(); me(); });
  app.querySelectorAll("input[name=sup]").forEach(x => x.onchange = () => { S.updateProfile({ support: +x.value, tasks: [] }); if (REMOTE) REMOTE.setSupport(+x.value).catch(() => {}); play("tap"); });
  $("#out").onclick = async () => {
    if (!confirm(DEMO ? "Reset the demo? Your demo progress in this browser will be deleted." : "Sign out on this device?")) return;
    if (!DEMO) await (await import("./auth.js")).signOut();
    S.signOut(); location.hash = ""; route();
  };
}

/* ---------------- routing ---------------- */
const ROUTES = { "": home, "/": home, "/island": home, "/mission": missionScreen, "/gym": gym, "/dojo": dojo, "/game": game, "/board": board, "/me": me };
// Text size and colour theme from the profile. Light is the default; "auto" removes the attribute so the phone's setting decides.
function applyText() {
  const p = S.profile(), root = document.documentElement;
  root.classList.toggle("big-text", !!(p && p.bigText));
  const theme = (p && p.theme) || "light";
  if (theme === "auto") delete root.dataset.theme; else root.dataset.theme = theme;
}
function route() {
  applyText();
  if (!S.profile()) return DEMO ? signIn() : schoolSignIn();
  soundUser(S.profile().nick);
  (ROUTES[location.hash.replace(/^#/, "")] || home)();
}
window.addEventListener("hashchange", route);
document.addEventListener("click", e => { if (e.target.closest("a.btn, a.tile, a.island, button.btn")) play("tap"); });
// A small buzz on every button, link, tab and place (Android). Runs first (capture), so a right or wrong answer's
// own buzz, which comes after, replaces it rather than being cut short.
// Buzz on buttons and links, never when tapping into a text box (on iPhone the tick could take the keyboard away).
document.addEventListener("click", e => {
  const t = e.target;
  if (t.closest("input:not([type=checkbox]):not([type=radio]), textarea, select")) return;
  const lab = t.closest("label");
  if (lab && lab.querySelector("input:not([type=checkbox]):not([type=radio]), textarea, select")) return;
  if (t.closest("button, a, label, [role=button], .place")) buzz("tap");
}, true);
// Real mode checks the school account on every start; demo mode goes straight in.
if (DEMO) route(); else schoolSignIn();
