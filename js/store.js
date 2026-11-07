// Storage: one student profile and their history, kept in this browser's localStorage.
// Every read and write is wrapped, so the app still runs (without saving) in private windows.
// With school sign-in on, each finished activity is also uploaded (see setRemote). The server works out the XP
// again and its number wins. Uploads wait in a queue while offline and are sent when the connection returns.
import { replayFactor } from "./kit/rewards.js";
import { setXP } from "./engine.js";

const KEY = "gv-demo-v1", SETTINGS = "gv-teacher-v1";
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

let state = read(KEY, null);
export const profile = () => state && state.profile;
export const history = () => (state && state.history) || [];
export const flags = () => (state && state.flags) || {};

export function signIn(nick, avatar) {
  state = { profile: { nick, avatar, support: 1, tasks: [] }, history: [], flags: {}, pending: [] };
  write(KEY, state);
}

/* ---------------- server sync (real mode only) ---------------- */
let remote = null, flushing = false;
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
const changed = () => { try { window.dispatchEvent(new Event("gv-sync")); } catch (e) {} };
// r = { save(clientId, textId, answers) -> server XP, load() -> saved attempts }
export function setRemote(r) { remote = r; }
export const pendingCount = () => ((state && state.pending) || []).length;
export async function flush() {
  if (!remote || flushing || !state) return;
  flushing = true;
  try {
    state.pending = state.pending || [];
    while (state.pending.length) {
      const a = state.pending[0];
      const xp = await remote.save(a.client_id, a.text_id, a.answers);
      const h = state.history.find(x => x.client_id === a.client_id); if (h) h.xp = xp;
      state.pending.shift(); write(KEY, state);
    }
  } catch (e) { /* offline or server busy: keep the queue and try again later */ }
  flushing = false; changed();
}
// Replaces this device's history with the server's copy (plus anything still waiting to upload).
export async function loadRemote() {
  if (!remote || !state) return;
  const saved = await remote.load(), ids = new Set(saved.map(a => a.client_id));
  state.history = [...saved, ...state.history.filter(h => !ids.has(h.client_id) && (state.pending || []).some(p => p.client_id === h.client_id))];
  write(KEY, state); changed();
}
function queue(attempt) {
  if (!remote) return;
  state.pending = state.pending || [];
  state.pending.push({ client_id: attempt.client_id, text_id: attempt.text_id, answers: attempt.answers });
  write(KEY, state); flush();
}
export function signOut() { state = null; try { localStorage.removeItem(KEY); } catch (e) {} }
export function updateProfile(patch) { Object.assign(state.profile, patch); write(KEY, state); }
export function setFlag(k, v) { state.flags[k] = v; write(KEY, state); }

// Saves one finished activity. XP is worked out here from the answers (in the real app this runs on the server,
// so a student can't send made-up XP). Replays of the same activity on the same day pay half, then nothing.
export function saveAttempt({ id, mode, answers, bonus = 0 }) {
  const per = setXP(answers, history());                                     // no XP for questions already met
  const factor = replayFactor(history(), id);                              // 1, 0.5 or 0 (replay rule from the kit)
  const xp = Math.round((per + 20 + bonus) * factor);
  const attempt = { client_id: newId(), text_id: id, mode, created_at: new Date().toISOString(), xp, answers };
  state.history.push(attempt); write(KEY, state); queue(attempt);
  return attempt;
}

// Games: XP comes from points with a shared daily cap (worked out by the caller with the kit's gameXP rule).
export function saveGame({ id, xp, answers }) {
  const attempt = { client_id: newId(), text_id: id, mode: "game", created_at: new Date().toISOString(), xp, answers };
  state.history.push(attempt); write(KEY, state); queue(attempt);
  return attempt;
}

// Teacher settings (demo): which islands are open, which leaderboards show. Shared by both pages in this browser.
export const teacher = () => read(SETTINGS, { open: ["harvest", "signal"], boards: { week: true, climbers: true, island: true } });
export const setTeacher = s => write(SETTINGS, s);
