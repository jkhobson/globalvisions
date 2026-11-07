// Short vibrations for the moments that matter: a tap, a right answer, a wrong one, a finished task.
// Android (Chrome and most others): the web Vibration API, navigator.vibrate.
// iPhone (Safari, iOS 18 or later): there is no vibration API for websites. Safari does give a light haptic tick
// when a "switch" checkbox is toggled, so a hidden switch is toggled instead. This is a known workaround, not an
// official API: it may not work on every iOS version or inside other apps' web views, and it can only give one tick
// (no long or double buzzes). iPads have no vibration motor.
// A page shown inside another site's frame (like the Claude demo viewer) may be blocked from vibrating either way.
// Every sound in kit/sound.js has a matching pattern, so play("ok") also buzzes. Students can turn it off on Agent ID.
const KEY = "gv-buzz";
const nav = typeof navigator !== "undefined" ? navigator : {};
const hasVibrate = typeof nav.vibrate === "function";
export const isIOS = /iP(hone|od|ad)/.test(nav.userAgent || "") || (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);
export const canBuzz = hasVibrate || isIOS;
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

let sw = null, ticking = false;
export const isTicking = () => ticking;     // true while the hidden switch's own click is running
function iosTick() {
  if (typeof document === "undefined" || !document.body) return;
  if (!sw) {
    sw = document.createElement("label");
    sw.setAttribute("aria-hidden", "true");
    sw.style.cssText = "position:fixed;left:-200px;top:0;width:1px;height:1px;opacity:0;overflow:hidden;pointer-events:none";
    const input = document.createElement("input");
    input.type = "checkbox"; input.setAttribute("switch", ""); input.tabIndex = -1;
    sw.appendChild(input); document.body.appendChild(sw);
  }
  const had = document.activeElement;
  ticking = true;
  try { sw.click(); } finally {
    ticking = false;
    if (had && had !== document.activeElement && had.focus) had.focus({ preventScroll: true });  // never steal the keyboard
  }
}
export function buzz(name) {
  if (!buzzOn() || !(name in PATTERNS) || ticking) return;
  if (hasVibrate) { try { nav.vibrate(PATTERNS[name]); } catch (e) { /* refused before the first tap: fine */ } return; }
  if (isIOS) iosTick();
}
