// The GP skills engine. Pure functions, no DOM, so the tests (and later the server) use the same rules.
// Everything is worked out from the student's history: an array of saved attempts like
//   { text_id, mode, created_at, xp, answers: [{ item, block, demand, first_try, support, trap, barrier, help }] }
//   support: "none" (right first time), "hint" (right after a thinking hint), "explained" (wrong, shown the answer)
//   barrier: "language" when the student got it right only after "Say it simpler" (no mastery change)
//   help: how many times language help (glossary, read-aloud) was opened. Language help never costs XP.
import { BLOCKS, RANKS, SKILLS } from "./content/curriculum.js";
import { XP } from "./kit/rewards.js";

export const P_START = 0.3, P_MASTERED = 0.85;

/* ---------------- mastery ---------------- */
// Replays every answer in order and returns { block: p }.
export function mastery(history, blocks = BLOCKS) {
  const p = Object.fromEntries(Object.keys(blocks).map(b => [b, P_START]));
  const answers = [...history].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at))).flatMap(h => h.answers || []);
  // A student who has met a question before has already seen its answer (right away, or in the review at the end),
  // so a repeat right answer counts like a right-after-hint answer (a small step), not a full one.
  const seenBefore = new Set();
  for (const a of answers) {
    applyAnswer(p, a.support === "none" && seenBefore.has(a.item) ? { ...a, support: "hint" } : a, blocks);
    if (a.item) seenBefore.add(a.item);
  }
  return p;
}
export function applyAnswer(p, a, blocks = BLOCKS) {
  const b = a.block; if (!(b in p) || a.barrier === "language" || a.reflection) return p;
  if (a.support === "none") {
    p[b] += (1 - p[b]) * 0.35;
    (blocks[b].needs || []).forEach(n => { if (n in p) p[n] += (1 - p[n]) * 0.15; });
  } else if (a.support === "hint") p[b] += (1 - p[b]) * 0.10;
  else {
    p[b] *= 0.55;
    if (a.gap && a.gap in p) p[a.gap] *= 0.70;      // the wrong option pointed at a gap in a lower block
  }
  return p;
}
export const mastered = (p, b) => (p[b] ?? 0) >= P_MASTERED;
export const ready = (p, b, blocks = BLOCKS) => !mastered(p, b) && (blocks[b].needs || []).every(n => mastered(p, n));

// The block to practise next in a skill: one already started (highest p not mastered and ready), else the first ready one.
export function nextBlock(p, skill, blocks = BLOCKS) {
  const ids = Object.keys(blocks).filter(b => blocks[b].skill === skill);
  const open = ids.filter(b => ready(p, b, blocks));
  if (!open.length) return ids.find(b => !mastered(p, b)) || ids[0];
  const started = open.filter(b => p[b] > P_START).sort((x, y) => p[y] - p[x]);
  return started[0] || open[0];
}

// Rank per skill from the share of its blocks mastered. Skills with no blocks yet return null.
export function rank(p, skill, blocks = BLOCKS) {
  const ids = Object.keys(blocks).filter(b => blocks[b].skill === skill);
  if (!ids.length) return null;
  const n = ids.filter(b => mastered(p, b)).length, share = n / ids.length;
  const i = share >= 1 ? 4 : share >= 0.75 ? 3 : share >= 0.5 ? 2 : share >= 0.25 ? 1 : 0;
  return { name: RANKS[i], index: i, mastered: n, total: ids.length };
}
export const ranks = (p, blocks = BLOCKS) => Object.fromEntries(SKILLS.map(s => [s, rank(p, s, blocks)]));

/* ---------------- thinking demand inside a practice set ---------------- */
// 2 right first time in a row: up one tier. 2 missed in a row: down one tier. Tiers 0 Core, 1 Stretch, 2 Challenge.
export function nextDemand(current, recent) {
  const last2 = recent.slice(-2);
  if (last2.length === 2 && last2.every(a => a.support === "none")) return Math.min(2, current + 1);
  if (last2.length === 2 && last2.every(a => a.support === "explained")) return Math.max(0, current - 1);
  return current;
}

/* ---------------- English support dial ---------------- */
// Levels 0 Full, 1 Guided, 2 Light, 3 Open. tasks: [{ help }] newest last, one per finished task.
// Fading: 3 tasks in a row with no language help, one step lighter. Catching: 2 tasks in a row with 3+ helps, one step more support.
export function nextSupport(level, tasks) {
  const last3 = tasks.slice(-3), last2 = tasks.slice(-2);
  if (last2.length === 2 && last2.every(t => t.help >= 3) && level > 0) return { level: level - 1, change: "more" };
  if (last3.length === 3 && last3.every(t => t.help === 0) && level < 3) return { level: level + 1, change: "less" };
  return { level, change: null };
}
// Short texts and simple stems at Full and Guided; "Say it simpler" is offered at Light and Open.
export const wrapping = level => ({ text: level <= 1 ? "short" : "long", stem: level <= 1 ? "simple" : "std",
  readAloud: level === 0, glossary: level <= 1 ? "shown" : level === 2 ? "tap" : "off", simpler: level >= 2 });

/* ---------------- XP ---------------- */
// Right first time pays by demand (10/15/20); after a thinking hint 5; explained 0.
// A language-barrier answer (right after "Say it simpler") pays half. Language help itself never costs XP.
export function answerXP(a) {
  if (a.reflection) return 5;
  if (a.support === "none") return a.barrier === "language" ? Math.round(XP.first[a.demand || 0] / 2) : XP.first[a.demand || 0];
  return a.support === "hint" ? XP.hint : 0;
}

/* ---------------- traps ---------------- */
export function trapCounts(history) {
  const c = {};
  history.flatMap(h => h.answers || []).forEach(a => (a.traps || (a.trap ? [a.trap] : [])).forEach(t => { c[t] = (c[t] || 0) + 1; }));
  return Object.entries(c).sort((a, b) => b[1] - a[1]);
}

/* ---------------- where the right answer goes ---------------- */
// Positions for the right answer across n questions with `slots` options each.
// Every position is used equally often (counts differ by at most 1), and no position comes up 3 times in a row,
// so students can't learn "it's usually the top one". rand is injectable for tests.
export function dealSlots(n, slots = 4, rand = Math.random) {
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const extra = shuffle([...Array(slots).keys()]);                   // which positions get the leftover questions
  const bag = Array.from({ length: n }, (_, i) => i < n - (n % slots) ? i % slots : extra[i % slots]);
  for (let t = 0; t < 200; t++) {
    shuffle(bag);
    if (!bag.some((s, i) => i >= 2 && s === bag[i - 1] && s === bag[i - 2])) return bag;
  }
  return Array.from({ length: n }, (_, i) => (i + extra[0]) % slots);  // fallback: simple rotation, always balanced
}
// Puts the right option (listed first in the content) at position `slot` and shuffles the wrong ones around it.
export function placeOptions(options, slot, rand = Math.random) {
  const wrong = options.slice(1);
  for (let i = wrong.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [wrong[i], wrong[j]] = [wrong[j], wrong[i]]; }
  wrong.splice(slot % options.length, 0, options[0]);
  return wrong;
}

// XP for one finished set. A question met before (its answer has been shown) earns no XP the second time,
// so getting answers wrong on purpose to learn them, then replaying, gains nothing. The server uses the same rule.
export function setXP(answers, history) {
  const before = new Set(history.flatMap(h => h.answers || []).map(a => a.item));
  return answers.reduce((s, a) => s + (a.reflection || a.game || !before.has(a.item) ? answerXP(a) : 0), 0);
}
// A first tap that is wrong and faster than this probably wasn't read properly.
export const QUICK_MS = 4000;
export const quickGuesses = answers => answers.filter(a => a.picks && a.picks[0] !== 0 && a.ms > 0 && a.ms < QUICK_MS).length;

/* ---------------- fresh questions ---------------- */
// How many times each question (item id) appears in the student's history.
export function seenCounts(history) {
  const c = {};
  history.flatMap(h => h.answers || []).forEach(a => { if (a.item) c[a.item] = (c[a.item] || 0) + 1; });
  return c;
}
// From several versions of a question, the one this student has seen least (ties broken at random).
export function freshest(ids, counts, rand = Math.random) {
  const least = Math.min(...ids.map(id => counts[id] || 0));
  const pool = ids.filter(id => (counts[id] || 0) === least);
  return pool[Math.floor(rand() * pool.length)];
}
