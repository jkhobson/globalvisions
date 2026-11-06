// Student app: screens and routing. Rules live in engine.js; content lives in js/content/.
import { BLOCKS, OBJECTIVES, SKILLS, SKILL_ICON, SUPPORT, TRAPS } from "./content/curriculum.js";
import { WORLDS } from "./content/worlds.js";
import { GLOSSARY, ITEMS, MISSION, SOURCES, TRUST_CARDS } from "./content/fizz.js";
import { applyAnswer, mastery, nextBlock, nextDemand, nextSupport, rank, ranks, trapCounts, wrapping, mastered, dealSlots, placeOptions, seenCounts, freshest } from "./engine.js";
import * as S from "./store.js";
import { DEMO } from "./config.js";
import { demoClass } from "./demo-class.js";
import { weeklyStreak, weekKey, gameXP } from "./kit/rewards.js";
import { play, soundUser, soundOn, setSound, say, canSpeak } from "./kit/sound.js";
import * as Cel from "./kit/celebrate.js";
import * as FX from "./kit/game-fx.js";

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
  if (m) { const p = S.profile(); if (!p || p.nick !== m.nick) { S.signOut(); S.signIn(m.nick, m.avatar); } return route(); }
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
function missionProgress() {
  const ids = new Set(S.history().map(h => h.text_id));
  return MISSION.phases.filter(ph => ids.has(`fizz-${ph.kind}`)).length / MISSION.phases.length;
}
function islandHealth(world) {
  if (world.id !== "harvest") return 0;
  const p = mastery(S.history()), ev = rank(p, "Evaluation");
  return Math.round(60 * missionProgress() + 40 * ev.mastered / ev.total);
}
function home() {
  const open = S.teacher().open, done = missionProgress();
  const nextPhase = MISSION.phases.find(ph => !S.history().some(h => h.text_id === `fizz-${ph.kind}`));
  const intro = S.profile().seenIntro ? "" : `<section class="card intro">
      <h3>Welcome, Agent ${esc(S.profile().nick)}!</h3>
      <ol><li><b>Do the mission</b> on an open island. Check sources and decide what to trust.</li>
        <li><b>Train in the Gym</b>. Questions get harder as you improve.</li>
        <li><b>Need help with English?</b> Tap <span class="gl">purple words</span> or 🔊. Help never costs XP.</li></ol>
      <p class="small">Tip: add this app to your home screen. iPhone: Share → Add to Home Screen. Android: menu ⋮ → Add to Home screen.</p>
      <button class="btn" id="introOk">Got it</button></section>`;
  page(`${intro}
    <section class="hero card">
      <p class="kicker">Today's mission · Harvest Key</p>
      <h2>${MISSION.title}</h2>
      <p>${done >= 1 ? "Mission complete. Replay it, or train in the Think Gym." : `Next: ${nextPhase.title}`}</p>
      <div class="bar"><i style="width:${Math.round(done * 100)}%"></i></div>
      <a class="btn" href="#/mission">${done > 0 && done < 1 ? "Continue" : done >= 1 ? "Replay" : "Start mission"}</a>
    </section>
    <div class="tiles">
      <a class="tile" href="#/gym"><span>🏋️</span><b>Think Gym</b><small>5 quick questions at your level</small></a>
      <a class="tile" href="#/game"><span>🕵️</span><b>Trust or Bust</b><small>Game: can you trust it?</small></a>
      <a class="tile" href="#/board"><span>🏆</span><b>Leaderboards</b><small>Nicknames only</small></a>
      <a class="tile" href="#/me"><span>🪪</span><b>Agent ID</b><small>Skills, traps, passport</small></a>
    </div>
    <h3 class="sec">The archipelago</h3>
    <div class="islands">${WORLDS.map(w => {
      const isOpen = open.includes(w.id), h = islandHealth(w), stamp = S.flags()[`stamp-${w.id}`];
      return `<${isOpen && w.missions ? "a href=\"#/mission\"" : "div"} class="island${isOpen ? "" : " locked"}">
        <span class="ic">${w.icon}</span><b>${w.island}</b><small>${w.challenge} · ${w.title}</small>
        ${isOpen ? `<div class="bar health" title="Island health"><i style="width:${h}%"></i></div><small>Island health ${h}%${stamp ? " · 🛂" : ""}</small>`
                 : `<small class="lock">🔒 Opens with ${w.challenge} (${w.weeks})</small>`}
      </${isOpen && w.missions ? "a" : "div"}>`; }).join("")}</div>`);
  const ok = $("#introOk"); if (ok) ok.onclick = () => { S.updateProfile({ seenIntro: true }); home(); };
}

/* ---------------- a question, at the student's support level ---------------- */
// Renders text with **glossary** words as buttons.
function richText(text, mode) {
  return esc(text).replace(/\*\*(.+?)\*\*/g, (m, w) => mode === "off" ? w : `<button class="gl" data-w="${w.toLowerCase()}">${w}</button>`).replace(/\n/g, "<br>");
}
function sourceCard(id, wrap) {
  const s = SOURCES[id], text = s[wrap.text], words = [...text.matchAll(/\*\*(.+?)\*\*/g)].map(m => m[1].toLowerCase());
  return `<article class="source">
    <header><span class="sic">${s.icon}</span><div><b>${s.kind}</b><small>By ${esc(s.author)} · ${s.year}</small></div>
      ${canSpeak ? `<button class="icon say" data-say="src" aria-label="Read aloud">🔊</button>` : ""}</header>
    <p>${richText(text, wrap.glossary)}</p>
    ${wrap.glossary === "shown" && words.length ? `<dl class="wordbox">${words.map(w => `<div><dt>${w}</dt><dd>${GLOSSARY[w] || ""}</dd></div>`).join("")}</dl>` : ""}
    ${wrap.glossary === "off" && words.length ? `<button class="link" id="wordhelp">Word help</button>` : ""}
  </article>`;
}

// Runs a list of items one after another. onAnswer(answer) after each; done(answers, help) at the end.
// One mission run: for each question slot, the version this student has seen least, plus one even spread of
// right-answer positions across all phases together. Made when the Briefing starts (or a replay starts).
let MISSION_PLAN = null;
function newMissionPlan() {
  const counts = seenCounts(S.history());
  const picks = Object.fromEntries(MISSION.phases.map(p => [p.kind, (p.items || []).map(v => Array.isArray(v) ? freshest(v, counts) : v)]));
  const ids = Object.values(picks).flat(), deal = dealSlots(ids.length);
  MISSION_PLAN = { picks, slots: Object.fromEntries(ids.map((id, i) => [id, deal[i]])) };
  return MISSION_PLAN;
}
const missionPlan = () => MISSION_PLAN || newMissionPlan();
function runItems(ids, { title, onDone, pick, slots: given } = {}) {
  const answers = []; let i = 0, help = 0;
  const box = document.createElement("div"); box.className = "runner";
  const nextId = () => pick ? pick(answers) : ids[i];
  const slots = given || dealSlots(pick ? ids : ids.length);   // where the right answer sits in each question: evenly spread
  function show() {
    if (pick ? answers.length >= ids : i >= ids.length) return onDone(answers, help);
    const id = nextId();
    if (!id) return onDone(answers, help);
    const it = ITEM[id], level = support(), helpAtStart = help;
    let wrap = wrapping(level), tries = 0, simplified = false, traps = [], gap = null;
    const total = pick ? ids : ids.length;
    const opts = placeOptions(it.options.map((o, k) => ({ ...o, k })), slots[answers.length] ?? 0);   // same order on every redraw
    function draw() {
      box.innerHTML = `<p class="kicker">${title || ""} · ${answers.length + 1} of ${total}</p>
        <div class="dots">${Array.from({ length: total }, (_, k) => `<i class="${k < answers.length ? (answers[k].support === "none" ? "ok" : answers[k].support === "hint" ? "mid" : "no") : k === answers.length ? "now" : ""}"></i>`).join("")}</div>
        ${it.source ? sourceCard(it.source, wrap) : ""}
        <div class="q card"><p class="stem">${richText(it.stem[wrap.stem], "off")}</p>
          ${canSpeak ? `<button class="icon say" data-say="q" aria-label="Read the question aloud">🔊</button>` : ""}
          <div class="opts">${opts.map(o => `<button class="opt" data-k="${o.k}">${esc(o.t)}</button>`).join("")}</div>
          <div class="fb" aria-live="polite"></div></div>`;
      box.querySelectorAll(".gl").forEach(b => b.onclick = () => { help++; play("info"); glossaryPop(b); });
      const wh = box.querySelector("#wordhelp"); if (wh) wh.onclick = () => { help++; wrap = { ...wrap, glossary: "tap" }; draw(); };
      box.querySelectorAll(".say").forEach(b => b.onclick = () => { help++; say(b.dataset.say === "src" ? SOURCES[it.source][wrap.text].replace(/\*\*/g, "") : it.stem[wrap.stem]); });
      box.querySelectorAll(".opt").forEach(b => b.onclick = () => choose(+b.dataset.k, b));
    }
    const settle = () => requestAnimationFrame(() => bring(box.querySelector(".fb").lastElementChild));
    function choose(k, btn) {
      const o = it.options[k], fb = box.querySelector(".fb");
      if (k === 0) {
        play("ok"); btn.classList.add("right");
        const barrier = simplified && tries === 1 ? "language" : undefined;
        const sup = tries === 0 || barrier ? "none" : "hint";
        if (barrier) traps = [];           // a language miss is not a thinking trap
        finish({ support: sup, barrier }, `<p class="good">✔ ${tries === 0 ? "Right first time!" : barrier ? "Right! The English was the tricky part, not your thinking." : "Right!"}</p><p>${esc(it.explain)}</p><p class="skilltag">${skillLine(it)}</p>`);
        return;
      }
      play("bad"); btn.classList.add("wrong"); btn.disabled = true; tries++;
      if (o.trap) traps.push(o.trap); if (o.b) gap = o.b;
      if (tries === 1 && wrap.simpler && !simplified) {
        simplified = true; wrap = wrapping(1);
        fb.innerHTML = `<p class="info">Let's try the same question in simpler English.</p><button class="btn" id="cont">Say it simpler</button>`;
        box.querySelector("#cont").onclick = () => { draw(); box.scrollIntoView({ block: "start" }); }; settle(); return;
      }
      if ((tries === 1) || (simplified && tries === 2)) {
        play("info");
        fb.innerHTML = `<p class="info">💡 Hint: ${esc(it.hint)}</p>${o.trap && TRAPS[o.trap] ? `<p class="small">Watch out: <b>${TRAPS[o.trap].name}</b>. ${TRAPS[o.trap].tip}</p>` : ""}`;
        settle(); return;
      }
      box.querySelectorAll(".opt").forEach(b => { b.disabled = true; if (+b.dataset.k === 0) b.classList.add("right"); });
      finish({ support: "explained" }, `<p class="info">The answer is shown in green.</p><p>${esc(it.explain)}</p><p class="skilltag">${skillLine(it)}</p>`);
    }
    function finish(res, html) {
      box.querySelectorAll(".opt").forEach(b => b.disabled = true);
      const a = { item: it.id, block: it.block, demand: it.demand, first_try: res.support === "none" && !res.barrier, ...res, traps, gap: res.support === "explained" ? gap : null, help: help - helpAtStart };
      answers.push(a); i++;
      const fb = box.querySelector(".fb");
      fb.innerHTML = html + `<button class="btn" id="next">${(pick ? answers.length >= ids : i >= ids.length) ? "Finish" : "Next"}</button>`;
      box.querySelector("#next").onclick = () => { show(); box.scrollIntoView({ block: "start" }); };
      box.querySelector("#next").focus({ preventScroll: true }); settle();
    }
    draw();
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
  const ids = new Set(S.history().map(h => h.text_id));
  const phase = MISSION.phases.find(ph => !ids.has(`fizz-${ph.kind}`)) || null;
  if (!phase) return missionDone();
  const steps = MISSION.phases.map(ph => `<li class="${ids.has(`fizz-${ph.kind}`) ? "done" : ph === phase ? "now" : ""}">${ph.title}</li>`).join("");
  const wrap = wrapping(support());
  page(`<p class="kicker">Harvest Key · ${MISSION.title}</p><ol class="phases">${steps}</ol><div id="stage"></div>`);
  const stage = $("#stage");
  if (phase.kind === "debrief") return debrief(stage);
  const intro = document.createElement("div");
  intro.className = "card brief";
  intro.innerHTML = phase.kind === "briefing"
    ? `<p class="kicker">📻 Message from the Chief</p><p>${esc(MISSION.brief[wrap.stem])}</p>${canSpeak ? `<button class="icon say" aria-label="Read aloud">🔊</button>` : ""}<button class="btn" id="begin">Accept mission</button>`
    : phase.kind === "dossier"
    ? `<p class="kicker">🗂️ Field Dossier</p><p>${wrap.stem === "simple" ? "Six sources. Some you can trust. Some you can't. Check each one." : "Six sources have arrived. Some are unreliable on purpose. Check who made each one, when, and why."}</p><button class="btn" id="begin">Open the dossier</button>`
    : `<p class="kicker">📌 Evidence Board</p><p>${wrap.stem === "simple" ? "Now compare the sources and the arguments." : "Time to weigh the evidence and judge the arguments people are making to the council."}</p><button class="btn" id="begin">Go to the board</button>`;
  stage.appendChild(intro);
  const s = intro.querySelector(".say"); if (s) s.onclick = () => say(MISSION.brief[wrap.stem]);
  intro.querySelector("#begin").onclick = () => {
    play("flip"); stage.innerHTML = "";
    const before = ranks(mastery(S.history()));
    const plan = phase.kind === "briefing" ? newMissionPlan() : missionPlan(), ids = plan.picks[phase.kind];
    stage.appendChild(runItems(ids, { title: phase.title, slots: ids.map(id => plan.slots[id]), onDone: (answers, help) => {
      const att = S.saveAttempt({ id: `fizz-${phase.kind}`, mode: "mission", answers });
      const note = afterTask(help);
      stage.innerHTML = `<div class="card done"><h2>${phase.title} complete</h2><p>+${att.xp} XP</p>${note}<button class="btn" id="nextPhase">Next phase</button> <a class="btn ghost" href="#/">Map</a></div>`;
      $("#nextPhase").onclick = missionScreen;       // same hash, so call the screen directly
      celebrate(att.xp, before);
    } }));
  };
}
function debrief(stage) {
  const level = support(), frames = level <= 1;
  stage.innerHTML = `<div class="card"><p class="kicker">🪞 Debrief · Reflection</p>
    <p>${level <= 1 ? "Think about your mission. There are no wrong answers here." : "Reflect on the mission. There are no wrong answers: say what you think and why."}</p>
    ${MISSION.debrief.prompts.map((p, i) => `<label class="refl"><b>${esc(p.q)}</b>
      ${frames ? `<small>Try: ${esc(p.frame)}</small>` : ""}
      <textarea id="r${i}" rows="3" placeholder="${frames ? esc(p.frame) : ""}"></textarea></label>`).join("")}
    <button class="btn" id="saveR">Finish mission</button><p class="small" id="rmsg"></p></div>`;
  $("#saveR").onclick = () => {
    const texts = MISSION.debrief.prompts.map((_, i) => $(`#r${i}`).value.trim());
    if (texts.filter(t => t.length >= 8).length < 2) { $("#rmsg").textContent = "Write at least two answers. One sentence each is fine."; return; }
    const before = ranks(mastery(S.history()));
    const answers = texts.map((t, i) => ({ item: `fizz-refl-${i}`, block: MISSION.debrief.block, reflection: true, text: t, support: "none", help: 0 }));
    const att = S.saveAttempt({ id: "fizz-debrief", mode: "mission", answers, bonus: 50 });
    S.setFlag("stamp-harvest", true);
    afterTask(0);
    celebrate(att.xp, before, { icon: "🛂", title: `Mission complete, ${S.profile().nick}!`, sub: "Harvest Key is recovering · new passport stamp" });
    missionDone();
  };
}
function missionDone() {
  page(`<div class="card done"><p class="kicker">Harvest Key · ${MISSION.title}</p><h2>Mission complete 🛂</h2>
    <p>The council now knows which sources to trust. Harvest Key's health is ${islandHealth(WORLDS[1])}%.</p>
    <p class="bring">🏠 ${esc(MISSION.bringItHome)}</p>
    <a class="btn" href="#/gym">Train in the Think Gym</a> <button class="btn ghost" id="replay">Replay mission</button></div>`);
  $("#replay").onclick = () => { S.setFlag("replay", Date.now()); replayMission(); };
}
function replayMission() {
  // Replay runs all question phases in one go (replay XP rules apply: half today, then nothing).
  const plan = newMissionPlan(), items = Object.values(plan.picks).flat();
  page(`<p class="kicker">Replay · ${MISSION.title}</p><div id="stage"></div>`);
  const before = ranks(mastery(S.history()));
  $("#stage").appendChild(runItems(items, { title: "Replay", slots: items.map(id => plan.slots[id]), onDone: (answers, help) => {
    const att = S.saveAttempt({ id: "fizz-replay", mode: "mission", answers });
    const note = afterTask(help);
    $("#stage").innerHTML = `<div class="card done"><h2>Replay complete</h2><p>+${att.xp} XP${att.xp === 0 ? " (replays pay half the first time each day, then nothing)" : ""}</p>${note}<a class="btn" href="#/">Map</a></div>`;
    celebrate(att.xp, before);
  } }));
}

/* ---------------- Think Gym: adaptive practice ---------------- */
function gym() {
  const p = mastery(S.history()), blockNow = nextBlock(p, "Evaluation");
  page(`<div class="card"><p class="kicker">🏋️ Think Gym · Evaluation</p>
    <p>Five questions picked for you. Get two right first time in a row and they get harder.</p>
    <p class="small">Focus now: <b>${BLOCKS[blockNow].name}</b></p><button class="btn" id="go">Start</button></div><div id="stage"></div>`);
  $("#go").onclick = () => {
    $("#go").closest(".card").remove();
    const live = { ...p }, seen = new Set(), before = ranks(p), counts = seenCounts(S.history());
    let demand = S.profile().gymDemand || 0;
    const pick = answers => {
      if (answers.length) { applyAnswer(live, answers[answers.length - 1]); demand = nextDemand(demand, answers); }
      const b = nextBlock(live, "Evaluation");
      const pool = ITEMS.filter(i => BLOCKS[i.block].skill === "Evaluation" && !seen.has(i.id));
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
  const arena = $("#arena"), cards = balancedCards(), answers = [];
  let i = 0, pts = 0, combo = 0, timer = null;
  const draw = () => {
    clearTimeout(timer);
    if (!arena.isConnected) return;                 // the student left the game: stop quietly
    if (i >= cards.length) return end();
    const c = cards[i]; $("#gleft").textContent = `${i + 1}/${cards.length}`;
    $("#gcard").innerHTML = `<p class="gt">${esc(c.t)}</p><div class="tb"><button class="btn trust" data-v="1">👍 Trust</button><button class="btn bust" data-v="0">🚫 Bust</button></div><p class="gwhy"></p>`;
    $("#gcard").querySelectorAll("button").forEach(b => b.onclick = e => answer(+b.dataset.v === 1, e));
    if (timed) timer = setTimeout(() => answer(null), 8000);
  };
  const answer = (v, e) => {
    clearTimeout(timer);
    if (!arena.isConnected) return;
    const c = cards[i], ok = v === c.ok, r = arena.getBoundingClientRect();
    const x = e ? e.clientX - r.left : r.width / 2, y = e ? e.clientY - r.top : r.height / 2;
    if (ok) { combo++; const g = 100 + 20 * (combo - 1); pts += g; FX.flash(arena); FX.burst(arena, x, y); FX.floatText(arena, x, y, `+${g}`); }
    else { combo = 0; FX.hurt(arena); FX.floatText(arena, x, y, v === null ? "Time!" : "Oops", "bad"); }
    FX.setPoints(arena, pts); FX.setCombo(arena, combo);
    answers.push({ item: `trust-${TRUST_CARDS.indexOf(c)}`, game: true, support: ok ? "none" : "explained", traps: !ok && c.trap ? [c.trap] : [] });
    $("#gcard").querySelectorAll("button").forEach(b => b.disabled = true);
    $("#gcard .gwhy").innerHTML = `${c.ok ? "Trust" : "Bust"}: ${esc(c.why)}`;
    i++; setTimeout(draw, ok ? 1300 : 2400);
  };
  const end = () => {
    const xp = gameXP(pts, S.history());
    S.saveGame({ id: "game-trust", xp, answers });
    $("#gcard").innerHTML = `<h2>${pts} points</h2><p>${answers.filter(a => a.support === "none").length} of ${cards.length} right · +${xp} XP</p><button class="btn" id="again">Play again</button> <a class="btn ghost" href="#/">Map</a>`;
    $("#again").onclick = game;
    if (xp) Cel.set(xp); else play("done");
  };
  FX.countdown(arena, () => arena.isConnected && draw());
}

/* ---------------- leaderboards ---------------- */
function board() {
  const t = S.teacher().boards, me = S.profile(), hist = S.history(), wk = weekKey(new Date());
  const myWeek = hist.filter(h => weekKey(h.created_at) === wk).reduce((s, h) => s + h.xp, 0);
  const before = mastery(hist.filter(h => weekKey(h.created_at) !== wk)), now = mastery(hist);
  const myClimb = Object.keys(BLOCKS).filter(b => mastered(now, b) && !mastered(before, b)).length;
  const cls = demoClass(), rows = [...cls.map(c => ({ ...c })), { nick: me.nick, avatar: me.avatar, weekXP: myWeek, climbed: myClimb, me: true }];
  const list = (arr, val, unit) => `<ol class="lb">${arr.slice(0, 10).map((r, i) => `<li class="${r.me ? "me" : ""}"><span class="pos">${i + 1}</span><span>${esc(r.avatar)} ${esc(r.nick)}</span><b>${r[val]} ${unit}</b></li>`).join("")}</ol>`;
  const week = [...rows].sort((a, b) => b.weekXP - a.weekXP), climb = [...rows].sort((a, b) => b.climbed - a.climbed);
  const meWeekPos = week.findIndex(r => r.me) + 1;
  const classHealth = Math.round((cls.reduce((s, c) => s + Object.values(c.p).filter(v => v >= 0.85).length, 0) + Object.keys(BLOCKS).filter(b => mastered(now, b)).length) / (rows.length * Object.keys(BLOCKS).length) * 100);
  page(`<h2>Leaderboards</h2><p class="small">Nicknames only. The weekly board resets every Monday, so anyone can win.</p>
    ${t.island ? `<section class="card"><h3>🏝️ Class goal: restore Harvest Key</h3><p>Every block anyone in the class masters helps.</p><div class="bar health"><i style="width:${classHealth}%"></i></div><p class="small">${classHealth}% restored</p></section>` : ""}
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
    <h3 class="sec">Colours</h3>
    <section class="card"><div class="seg three">${[["Auto", "auto"], ["Light", "light"], ["Dark", "dark"]].map(([n, v]) => `<button class="segb${(prof.theme || "light") === v ? " on" : ""}" data-theme="${v}">${n}</button>`).join("")}</div>
    <p class="small">Light is the default. Auto follows your phone's setting.</p></section>
    ${DEMO ? `<p><a class="btn ghost" href="teacher.html">Teacher view (demo)</a></p>` : ""}
    <button class="btn ghost" id="out">${DEMO ? "Sign out and reset demo" : "Sign out"}</button>`);
  app.querySelectorAll("[data-theme]").forEach(b => b.onclick = () => { S.updateProfile({ theme: b.dataset.theme }); applyText(); me(); });
  app.querySelectorAll("[data-big]").forEach(b => b.onclick = () => { S.updateProfile({ bigText: b.dataset.big === "true" }); applyText(); me(); });
  app.querySelectorAll("input[name=sup]").forEach(x => x.onchange = () => { S.updateProfile({ support: +x.value, tasks: [] }); play("tap"); });
  $("#out").onclick = async () => {
    if (!confirm(DEMO ? "Reset the demo? Your demo progress in this browser will be deleted." : "Sign out on this device?")) return;
    if (!DEMO) await (await import("./auth.js")).signOut();
    S.signOut(); location.hash = ""; route();
  };
}

/* ---------------- routing ---------------- */
const ROUTES = { "": home, "/": home, "/mission": missionScreen, "/gym": gym, "/game": game, "/board": board, "/me": me };
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
// Real mode checks the school account on every start; demo mode goes straight in.
if (DEMO) route(); else schoolSignIn();
