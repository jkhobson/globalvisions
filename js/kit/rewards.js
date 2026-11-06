// Reward rules from Checkpoint Quest, made general so any subject app can use them (pure functions, no DOM).
// Everything is worked out from the student's history: an array of saved attempts like
//   { text_id: "s2-ped-case1", mode: "practice", score: 6, max_score: 8, xp: 95, level_end: 1,
//     created_at: "2026-11-03T08:00:00Z", answers: [{ skill: "Analysis", level: 1, first_try: true, support: "none" }] }
// For a product, run the same XP rules on the server too, so a student can't send made-up XP.

/* ---------------- XP ---------------- */
// Right first time pays by level (0 Core ... 3 Challenge); help used pays less.
export const XP = { first: [10, 15, 20, 25], hint: 5, rescue: 3, easier: 3, explained: 0,
                    finish: 20, levelUp: 25, streakWeek: 10, sectionPass: 40, mission: 50 };
export function answerXP(a) { return a.support === "none" || a.first_try ? XP.first[a.level || 0] : (XP[a.support] || 0); }

// Replays: the second play of the same activity on the same day earns half, the third and later earn nothing.
// (This closes the grinding loophole found in Checkpoint Quest, where sets paid full XP on every replay.)
// Think Gym sets each have their own id, so they share one rule: 3 full sets a day, then 2 at half, then nothing.
// (The server uses the same rules: supabase/progress.sql.)
export function replayFactor(history, id, now = new Date()) {
  const today = dayNo(now), gym = /^gym-/.test(id || "");
  const n = history.filter(h => (gym ? /^gym-/.test(h.text_id || "") : h.text_id === id) && dayNo(new Date(h.created_at)) === today).length;
  if (gym) return n < 3 ? 1 : n < 5 ? 0.5 : 0;
  return n === 0 ? 1 : n === 1 ? 0.5 : 0;
}
export function activityXP(answers, { history = [], id, levelUps = 0, now = new Date() } = {}) {
  const raw = answers.reduce((s, a) => s + answerXP(a), 0) + XP.finish + levelUps * XP.levelUp;
  return Math.round(raw * replayFactor(history, id, now));
}
// Games share one daily cap.
export const GAME_XP_DAY = 30;
export function gameXP(points, history, isGame = h => /^game-/.test(h.text_id || ""), now = new Date()) {
  const today = dayNo(now), used = history.filter(h => isGame(h) && dayNo(new Date(h.created_at)) === today).reduce((s, h) => s + (h.xp || 0), 0);
  return Math.max(0, Math.min(Math.round(points / 10), GAME_XP_DAY - used));
}

/* ---------------- school days and weeks ---------------- */
export const TZ_OFFSET_MIN = 7 * 60;            // school time zone (UTC+7); change for your school
const local = d => new Date(new Date(d).getTime() + TZ_OFFSET_MIN * 60000);
export const dayNo = d => Math.floor(local(d).getTime() / 864e5);
export function weekKey(date) {                  // the Monday of the week, in school time
  const d = local(date), day = (d.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day)).toISOString().slice(0, 10);
}
const prevWeek = k => { const d = new Date(k + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() - 7); return d.toISOString().slice(0, 10); };

/* ---------------- weekly streak ---------------- */
// Weeks in a row with at least PER_WEEK activities (games don't count). This week counts once it is reached,
// so a streak isn't lost on a Monday morning.
export const PER_WEEK = 2;
export function weeklyStreak(history, { now = new Date(), counts = h => !/^game-/.test(h.text_id || "") } = {}) {
  const c = {};
  history.filter(counts).forEach(h => { const k = weekKey(h.created_at); c[k] = (c[k] || 0) + 1; });
  let k = weekKey(now), streak = 0;
  if ((c[k] || 0) < PER_WEEK) k = prevWeek(k);
  while ((c[k] || 0) >= PER_WEEK) { streak++; k = prevWeek(k); }
  return { streak, thisWeek: c[weekKey(now)] || 0 };
}
// +10 XP when this save is the one that completes the week.
export const streakBonus = (history, now = new Date()) => weeklyStreak(history, { now }).thisWeek === PER_WEEK - 1 ? XP.streakWeek : 0;

/* ---------------- levels: steady level and level-ups ---------------- */
// Each graded activity gives a step (e.g. 0..7). The steady level is the middle of the last three, so one bad day
// doesn't knock a student down and moving up takes more than one good result.
export const STEADY_OF = 3, LEVEL_UP_XP = 30;
export function steady(steps) {
  const b = steps.slice(-STEADY_OF).filter(x => x != null).sort((x, y) => x - y);
  return b.length ? b[Math.floor((b.length - 1) / 2)] : null;
}
export function peak(steps) { let p = null; for (let i = 1; i <= steps.length; i++) { const s = steady(steps.slice(0, i)); if (p == null || s > p) p = s; } return p; }
// A new result that lifts the steady level above anything reached before is a level-up: celebrate it.
export function levelUpAfter(steps, newStep) {
  const before = peak(steps), after = steady([...steps, newStep]);
  return before != null && after != null && after > before ? { from: before, to: after } : null;
}

/* ---------------- badges ---------------- */
// Each rule: { name, why, test(history) }. Add your own; the Me page shows earned ones and greys out the rest.
const firstRight = (history, skill) => history.flatMap(h => h.answers || []).filter(a => a.skill === skill && a.first_try).length;
export const BADGES = [
  { name: "First steps", why: "Finished the diagnostic", test: h => h.some(x => x.mode === "baseline") },
  { name: "Off the mark", why: "Finished a practice activity", test: h => h.some(x => x.mode === "practice") },
  { name: "Bookworm", why: "Finished 5 practice activities", test: h => h.filter(x => x.mode === "practice").length >= 5 },
  { name: "On a roll", why: "3-week streak", test: h => weeklyStreak(h).streak >= 3 },
  // One badge per skill for 10 right first time. Economics example skills:
  ...[["Calculation", "Number cruncher"], ["Diagram", "Diagram designer"], ["Analysis", "Chain builder"],
      ["Evaluation", "Evaluator"], ["Data", "Data detective"], ["Definition", "Word wizard"]]
    .map(([skill, name]) => ({ name, why: `10 ${skill.toLowerCase()} questions right first time`, test: h => firstRight(h, skill) >= 10 }))
];
export const earned = (history, rules = BADGES) => rules.filter(r => r.test(history)).map(({ name, why }) => ({ name, why }));
// Badges that are new after this save (to celebrate): compare before and after.
export function newBadges(history, attempt, rules = BADGES) {
  const had = new Set(earned(history, rules).map(b => b.name));
  return earned([...history, attempt], rules).filter(b => !had.has(b.name));
}

/* ---------------- the road (badge trail) ---------------- */
// Stops: start, then for each section its mission (progress ring) and a gate test (pass mark), mock flags, finish.
// sections: [{ id: 1, title: "The basic economic problem", steps: ["cards-s1", "case-s1a", ...], gate: "test-s1" }]
export function roadStops(history, sections, { pass = 0.7, mocks = {}, start = "diagnostic", open = () => true } = {}) {
  const ids = new Set(history.map(h => h.text_id));
  const best = id => { const t = history.filter(h => h.text_id === id && h.max_score > 0); return t.length ? Math.max(...t.map(h => h.score / h.max_score)) : null; };
  const stops = [{ kind: "start", title: "Start", done: ids.has(start) }];
  let gates = 0;
  sections.forEach(s => {
    const done = s.steps.filter(id => ids.has(id)).length;
    stops.push({ kind: "section", id: s.id, title: s.title, locked: !open(s.id), progress: s.steps.length ? done / s.steps.length : 0, done: done === s.steps.length });
    const b = best(s.gate), ok = b != null && b >= pass; if (ok) gates++;
    stops.push({ kind: "gate", id: s.id, title: `Section ${s.id} test`, done: ok, best: b });
    (mocks[s.id] || []).forEach(m => stops.push({ kind: "mock", id: m, title: "Mock exam", done: ids.has(m) }));
  });
  stops.push({ kind: "finish", title: "Exam ready!", done: gates === sections.length, sub: `${gates} of ${sections.length} tests passed` });
  return stops;
}
export function roadHere(stops) { let last = -1; stops.forEach((s, i) => { if (s.done) last = i; }); return Math.min(last + 1, stops.length - 1); }

/* ---------------- leaderboards ---------------- */
// rows: [{ name, history }] for one class. Returns this week, all time and most improved (first vs latest test, in points).
export function leaderboards(rows, { now = new Date(), isTest = h => h.mode === "baseline" } = {}) {
  const wk = weekKey(now), pct = h => h.max_score ? Math.round(100 * h.score / h.max_score) : 0;
  const sum = (hs) => hs.reduce((s, h) => s + (h.xp || 0), 0);
  const week = rows.map(r => ({ name: r.name, xp: sum(r.history.filter(h => weekKey(h.created_at) === wk)) })).sort((a, b) => b.xp - a.xp);
  const all = rows.map(r => ({ name: r.name, xp: sum(r.history) })).sort((a, b) => b.xp - a.xp);
  const improved = rows.map(r => { const t = r.history.filter(isTest).sort((a, b) => a.created_at.localeCompare(b.created_at));
    return t.length >= 2 ? { name: r.name, gain: pct(t[t.length - 1]) - pct(t[0]) } : null; }).filter(Boolean).sort((a, b) => b.gain - a.gain);
  return { week, all, improved };
}
