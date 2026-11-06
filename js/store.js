// Demo-mode storage: one student profile and their history, kept in this browser's localStorage.
// Every read and write is wrapped, so the app still runs (without saving) in private windows.
import { replayFactor } from "./kit/rewards.js";
import { answerXP } from "./engine.js";

const KEY = "gv-demo-v1", SETTINGS = "gv-teacher-v1";
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

let state = read(KEY, null);
export const profile = () => state && state.profile;
export const history = () => (state && state.history) || [];
export const flags = () => (state && state.flags) || {};

export function signIn(nick, avatar) {
  state = { profile: { nick, avatar, support: 1, tasks: [] }, history: [], flags: {} };
  write(KEY, state);
}
export function signOut() { state = null; try { localStorage.removeItem(KEY); } catch (e) {} }
export function updateProfile(patch) { Object.assign(state.profile, patch); write(KEY, state); }
export function setFlag(k, v) { state.flags[k] = v; write(KEY, state); }

// Saves one finished activity. XP is worked out here from the answers (in the real app this runs on the server,
// so a student can't send made-up XP). Replays of the same activity on the same day pay half, then nothing.
export function saveAttempt({ id, mode, answers, bonus = 0 }) {
  const per = answers.reduce((s, a) => s + answerXP(a), 0);
  const factor = replayFactor(history(), id);                              // 1, 0.5 or 0 (replay rule from the kit)
  const xp = Math.round((per + 20 + bonus) * factor);
  const attempt = { text_id: id, mode, created_at: new Date().toISOString(), xp, answers };
  state.history.push(attempt); write(KEY, state);
  return attempt;
}

// Games: XP comes from points with a shared daily cap (worked out by the caller with the kit's gameXP rule).
export function saveGame({ id, xp, answers }) {
  const attempt = { text_id: id, mode: "game", created_at: new Date().toISOString(), xp, answers };
  state.history.push(attempt); write(KEY, state);
  return attempt;
}

// Teacher settings (demo): which islands are open, which leaderboards show. Shared by both pages in this browser.
export const teacher = () => read(SETTINGS, { open: ["harvest"], boards: { week: true, climbers: true, island: true } });
export const setTeacher = s => write(SETTINGS, s);
