// Short vibrations for the moments that matter: a tap, a right answer, a wrong one, a finished task.
// Uses the web Vibration API (navigator.vibrate). It works on most Android phones in Chrome. Safari on iPhone and
// iPad does not offer it to web apps, so there it quietly does nothing (iPads have no vibration motor anyway).
// Every sound in kit/sound.js has a matching pattern, so play("ok") also buzzes. Students can turn it off on Agent ID.
const KEY = "gv-buzz";
export const canBuzz = typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
export function buzzOn() { try { return localStorage.getItem(KEY) !== "off"; } catch (e) { return true; } }
export function setBuzz(on) { try { localStorage.setItem(KEY, on ? "on" : "off"); } catch (e) {} }

// Patterns in milliseconds: buzz, pause, buzz… Kept short: feedback, not an alarm.
const PATTERNS = {
  tap: 8, click: 8, flip: 12, tick: 5, tock: 5, steps: [8, 60, 8],
  ok: [18, 50, 30],                  // a happy double tap
  bad: [70, 40, 70],                 // a firmer double buzz
  info: 12, glint: 10, creak: 20, heart: [25, 80, 25], alarm: [80, 60, 80],
  level: [15, 40, 15, 40, 40], done: [20, 40, 20, 40, 60], win: [30, 50, 30, 50, 90]
};
export function buzz(name) {
  if (!canBuzz || !buzzOn() || !(name in PATTERNS)) return;
  try { navigator.vibrate(PATTERNS[name]); } catch (e) { /* some browsers refuse before the first tap: fine */ }
}
