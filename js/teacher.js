// Teacher page. Demo mode: the made-up class plus the demo student in this browser.
// School mode: sign in, pick a class, and see that class's real saved work.
// Shows both dials side by side, a block heat map, top traps, quick guesses, and the switches for islands and leaderboards.
import { BLOCKS, SUPPORT, TRAPS } from "./content/curriculum.js";
import { WORLDS } from "./content/worlds.js";
import { mastery, rank, trapCounts, quickGuesses } from "./engine.js";
import * as S from "./store.js";
import { demoClass } from "./demo-class.js";
import { weekKey } from "./kit/rewards.js";
import { DEMO } from "./config.js";

const esc = t => String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const app = document.getElementById("app");
const blocks = Object.keys(BLOCKS);
// Skills that islands practise so far, shown as rank columns.
const RANKED = ["Evaluation", "Communication", "Collaboration"].filter(s => blocks.some(b => BLOCKS[b].skill === s));
const heat = v => `hsl(${Math.round(Math.min(1, v / 0.85) * 120)} 70% ${v >= 0.85 ? 38 : 45}%)`;

// One table row from a student's saved activities (oldest first).
export function studentRow(base, history, now = new Date()) {
  const wk = weekKey(now), answers = history.flatMap(h => h.answers || []);
  const last = history.length ? history[history.length - 1].created_at : null;
  return { ...base, p: mastery(history), traps: trapCounts(history), quick: quickGuesses(answers),
    weekXP: history.filter(x => weekKey(x.created_at) === wk).reduce((s, x) => s + (x.xp || 0), 0), last };
}
const ago = t => {
  if (!t) return "never";
  const d = Math.floor((Date.now() - new Date(t)) / 86400000);
  return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`;
};

function demoRows() {
  const list = demoClass().map(r => ({ ...r, quick: r.quick || 0, last: null }));
  const prof = S.profile();
  if (prof) list.unshift(studentRow({ nick: prof.nick, avatar: prof.avatar, me: true, support: prof.support }, S.history()));
  return list;
}

// view: { heading, note, list, settings, save(settings), top (html above the table) }
function render(view) {
  const t = view.settings, list = view.list;
  app.innerHTML = `<main class="wide">
    <h1>Teacher view <small class="small">${esc(view.heading)}</small></h1>
    ${view.top || ""}
    <p class="note">${view.note}</p>
    <section class="card"><h3>Class: two dials and skill blocks</h3>
    <p class="small">English support and GP skill are shown separately, so "weak at Communication" and "needs English help" are never mixed up. Colour = mastery of each block (green = mastered). <b>Quick guesses</b> counts wrong first answers tapped in under 4 seconds: a sign of guessing, not thinking.</p>
    ${list.length ? `<div class="scroll"><table class="heat"><thead><tr><th>Student</th><th>English help</th><th>XP this week</th>${RANKED.map(s => `<th>${s} rank</th>`).join("")}
      ${blocks.map(b => `<th title="${esc(BLOCKS[b].name)} (${BLOCKS[b].objectives.join(", ")})">${b}</th>`).join("")}<th>Top trap</th><th>Quick guesses</th>${view.real ? "<th>Last active</th>" : ""}</tr></thead>
    <tbody>${list.map(r => `<tr class="${r.me ? "me" : ""}"><td>${r.me ? "★ " : ""}${esc(r.avatar)} ${esc(r.nick)}</td><td>${SUPPORT[r.support] ? SUPPORT[r.support].name : "–"}</td><td>${r.weekXP}</td>
      ${RANKED.map(s => `<td>${rank(r.p, s).name}</td>`).join("")}${blocks.map(b => `<td class="cell" style="background:${heat(r.p[b])}" title="${Math.round(r.p[b] * 100)}%">${Math.round(r.p[b] * 100)}</td>`).join("")}
      <td>${r.traps[0] && TRAPS[r.traps[0][0]] ? esc(TRAPS[r.traps[0][0]].name) : "–"}</td><td>${r.quick ? `<b>${r.quick}</b>` : "0"}</td>${view.real ? `<td>${ago(r.last)}</td>` : ""}</tr>`).join("")}</tbody></table></div>`
      : `<p>Nobody has joined this class yet. Give students the class code.</p>`}
    <p class="small">Blocks: ${blocks.map(b => `<b>${b}</b> ${esc(BLOCKS[b].name)} (${BLOCKS[b].objectives.join(", ")})`).join(" · ")}</p></section>

    <section class="card"><h3>Islands open for students</h3><p class="small">Open an island when the challenge starts in class. Harvest Key (C2) and Signal Point (C3) have missions so far.</p>
      <div class="toggles">${WORLDS.map(w => `<label><input type="checkbox" data-w="${w.id}" ${t.open.includes(w.id) ? "checked" : ""}> ${w.icon} ${w.island} <small>(${w.challenge})</small></label>`).join("")}</div></section>
    <section class="card"><h3>Leaderboards</h3>
      <div class="toggles">${[["week", "This week's XP"], ["climbers", "Skill climbers (growth)"], ["island", "Class island goal"]].map(([k, n]) => `<label><input type="checkbox" data-b="${k}" ${t.boards[k] ? "checked" : ""}> ${n}</label>`).join("")}</div>
      <p class="small" id="saved" aria-live="polite"></p></section>
    <p><a class="btn ghost" href="index.html">Open the student app</a></p></main>`;
  const changed = async () => {
    const s = { open: WORLDS.map(w => w.id).filter(id => app.querySelector(`[data-w=${id}]`).checked),
      boards: Object.fromEntries([...app.querySelectorAll("[data-b]")].map(c => [c.dataset.b, c.checked])) };
    const msg = app.querySelector("#saved");
    try { await view.save(s); view.settings = s; msg.textContent = "Saved."; } catch (e) { msg.textContent = "Couldn't save. Check your connection and try again."; }
  };
  app.querySelectorAll("[data-w], [data-b]").forEach(c => c.onchange = changed);
}

function demo() {
  render({ heading: "demo class 7A", list: demoRows(), settings: S.teacher(), save: s => S.setTeacher(s),
    note: `Demo mode: a made-up class of 14 nickname students${S.profile() ? ", plus the demo student signed in on this browser (marked ★)" : ""}. No real student data.` });
}

// School mode: sign in, make classes and codes, and see each class's real work.
async function real() {
  const A = await import("./auth.js");
  const card = html => { app.innerHTML = `<main class="wide"><h1>Teacher view</h1><section class="card">${html}</section></main>`; };
  card("<p>Loading…</p>");
  const acc = await A.account().catch(() => null);
  if (!acc) { card(`<h3>Sign in</h3><button class="btn" id="tg">Sign in with your school Google account</button>`); app.querySelector("#tg").onclick = () => A.signInWithGoogle(); return; }
  if (!(await A.isTeacher())) { card(`<h3>Teachers only</h3><p>${esc(acc.email)} isn't set up as a teacher. See docs/setup-school-login.md, step 6.</p>`); return; }
  let chosen = null;
  const show = async () => {
    const classes = await A.teacherClasses();
    const cls = classes.find(c => c.id === chosen) || classes[0];
    chosen = cls && cls.id;
    const top = `<section class="card"><h3>My classes</h3>
      ${classes.length ? `<div class="toggles">${classes.map(c => `<label><input type="radio" name="cls" value="${c.id}" ${c.id === chosen ? "checked" : ""}> <b>${esc(c.name)}</b> · code <b class="chip">${esc(c.code)}</b> · ${c.students.length} joined</label>`).join("")}</div>` : "<p>No classes yet.</p>"}
      <label>New class name <input id="cn" maxlength="30" placeholder="e.g. 7A"></label>
      <button class="btn" id="mk">Make class and code</button> <span id="cm" class="small"></span></section>`;
    let list = [];
    if (cls) {
      const [students, attempts] = await Promise.all([A.classStudents(cls.id), A.classAttempts(cls.id)]);
      list = students.map(s => studentRow({ nick: s.nick, avatar: s.avatar, support: s.support }, attempts.filter(a => a.user_id === s.user_id)))
        .sort((a, b) => a.nick.localeCompare(b.nick));
    }
    const settings = (cls && cls.settings) || { open: ["harvest"], boards: { week: true, climbers: true, island: true } };
    render({ real: true, heading: cls ? `class ${cls.name}` : "no class yet", top, list, settings,
      save: s => cls ? A.saveClassSettings(cls.id, s) : Promise.reject(new Error("no class")),
      note: "Real class data, saved on the server. XP is worked out by the server, so it can't be edited on a student's device." });
    app.querySelectorAll("[name=cls]").forEach(r => r.onchange = () => { chosen = r.value; show(); });
    app.querySelector("#mk").onclick = async () => {
      const n = app.querySelector("#cn").value.trim(); if (!n) return;
      const r = await A.createClass(n); if (r.error) app.querySelector("#cm").textContent = r.error; else show();
    };
  };
  show().catch(() => card(`<p>Couldn't load your classes. Check your connection and reload the page.</p>`));
}
if (DEMO) demo(); else real();
