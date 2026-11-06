// Teacher page (demo): the made-up class plus the demo student in this browser.
// Shows both dials side by side, a block heat map, top traps, and the switches for islands and leaderboards.
import { BLOCKS, SUPPORT, TRAPS } from "./content/curriculum.js";
import { WORLDS } from "./content/worlds.js";
import { mastery, rank, trapCounts } from "./engine.js";
import * as S from "./store.js";
import { demoClass } from "./demo-class.js";
import { weekKey } from "./kit/rewards.js";

const esc = t => String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const app = document.getElementById("app");
const blocks = Object.keys(BLOCKS);

function rows() {
  const list = demoClass();
  const prof = S.profile();
  if (prof) {
    const h = S.history(), wk = weekKey(new Date());
    list.unshift({ nick: prof.nick, avatar: prof.avatar, me: true, support: prof.support, p: mastery(h),
      weekXP: h.filter(x => weekKey(x.created_at) === wk).reduce((s, x) => s + x.xp, 0), traps: trapCounts(h) });
  }
  return list;
}
const heat = v => `hsl(${Math.round(Math.min(1, v / 0.85) * 120)} 70% ${v >= 0.85 ? 38 : 45}%)`;

function render() {
  const t = S.teacher(), list = rows();
  app.innerHTML = `<main class="wide">
    <h1>Teacher view <small class="small">demo class 7A</small></h1>
    <p class="note">Demo mode: a made-up class of 14 nickname students${S.profile() ? ", plus the demo student signed in on this browser (marked ★)" : ""}. No real student data.</p>
    <section class="card"><h3>Class: two dials and the Evaluation strand</h3>
    <p class="small">English support and GP skill are shown separately, so "weak at Evaluation" and "needs English help" are never mixed up. Colour = mastery of each block (green = mastered).</p>
    <div class="scroll"><table class="heat"><thead><tr><th>Student</th><th>English help</th><th>XP this week</th><th>Evaluation rank</th>
      ${blocks.map(b => `<th title="${esc(BLOCKS[b].name)} (${BLOCKS[b].objectives.join(", ")})">${b}</th>`).join("")}<th>Top trap</th></tr></thead>
    <tbody>${list.map(r => `<tr class="${r.me ? "me" : ""}"><td>${r.me ? "★ " : ""}${esc(r.avatar)} ${esc(r.nick)}</td><td>${SUPPORT[r.support].name}</td><td>${r.weekXP}</td>
      <td>${rank(r.p, "Evaluation").name}</td>${blocks.map(b => `<td class="cell" style="background:${heat(r.p[b])}" title="${Math.round(r.p[b] * 100)}%">${Math.round(r.p[b] * 100)}</td>`).join("")}
      <td>${r.traps[0] ? esc(TRAPS[r.traps[0][0]].name) : "–"}</td></tr>`).join("")}</tbody></table></div>
    <p class="small">Blocks: ${blocks.map(b => `<b>${b}</b> ${esc(BLOCKS[b].name)} (${BLOCKS[b].objectives.join(", ")})`).join(" · ")}</p></section>

    <section class="card"><h3>Islands open for students</h3><p class="small">Open an island when the challenge starts in class. Only Harvest Key has a mission in this prototype.</p>
      <div class="toggles">${WORLDS.map(w => `<label><input type="checkbox" data-w="${w.id}" ${t.open.includes(w.id) ? "checked" : ""}> ${w.icon} ${w.island} <small>(${w.challenge})</small></label>`).join("")}</div></section>
    <section class="card"><h3>Leaderboards</h3>
      <div class="toggles">${[["week", "This week's XP"], ["climbers", "Skill climbers (growth)"], ["island", "Class island goal"]].map(([k, n]) => `<label><input type="checkbox" data-b="${k}" ${t.boards[k] ? "checked" : ""}> ${n}</label>`).join("")}</div></section>
    <p><a class="btn ghost" href="index.html">Open the student app</a></p></main>`;
  app.querySelectorAll("[data-w]").forEach(c => c.onchange = () => {
    const s = S.teacher(); s.open = WORLDS.map(w => w.id).filter(id => app.querySelector(`[data-w=${id}]`).checked); S.setTeacher(s);
  });
  app.querySelectorAll("[data-b]").forEach(c => c.onchange = () => { const s = S.teacher(); s.boards[c.dataset.b] = c.checked; S.setTeacher(s); });
}
render();
