// In-game effects from Checkpoint Quest's games (Word Rain, Trap Dodger, Crossword...). No libraries.
// - countdown(box, go): "3, 2, 1, Go!" over the play area with ticks, then calls go().
// - floatText(box, x, y, "+20", "bad"?): a number that pops up and floats away at (x, y) in the box's pixels.
// - burst(box, x, y, colours, n): a ring of particles flying out from (x, y).
// - setPoints(hud, n) / setCombo(hud, n): a score chip that bumps when it changes, and a streak chip (fire x2, x3...)
//   that appears after two in a row. The HUD needs <span class="hchip pts"><b id="gpts">0</b></span>
//   and <span class="hchip combo" id="gcombo" hidden></span>.
// - hurt(box) / flash(box): red shake for a wrong answer, white-gold flash for a right one.
// box must be position:relative (the .arena class does this).
import { play } from "./sound.js";

export function setPoints(el, n) { const b = el.querySelector("#gpts"); if (!b || b.textContent === String(n)) return; b.textContent = n; const c = b.parentNode; c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump"); }
export function setCombo(el, n) { const c = el.querySelector("#gcombo"); if (!c) return; c.hidden = n < 2; c.textContent = `🔥 ×${n}`; c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump"); }

export function countdown(box, go) {
  const o = document.createElement("div"); o.className = "gcount"; box.appendChild(o);
  let n = 3;
  const step = () => {
    o.innerHTML = `<span>${n || "Go!"}</span>`;
    play(n ? "tap" : "level");
    if (n-- > 0) setTimeout(step, 650); else setTimeout(() => { o.remove(); go(); }, 500);
  };
  step();
}
export function floatText(box, x, y, text, cls = "") {
  const f = document.createElement("b"); f.className = "gfloat " + cls; f.textContent = text;
  f.style.left = x + "px"; f.style.top = y + "px"; box.appendChild(f); setTimeout(() => f.remove(), 950);
}
export function burst(box, x, y, colors = ["#FFD54A", "#4FC3F7", "#F06292", "#81C784"], n = 12) {
  for (let i = 0; i < n; i++) {
    const p = document.createElement("i"); p.className = "gpart";
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.4, d = 34 + Math.random() * 30;
    p.style.cssText = `left:${x}px;top:${y}px;--dx:${(Math.cos(a) * d).toFixed(0)}px;--dy:${(Math.sin(a) * d).toFixed(0)}px;background:${colors[i % colors.length]}`;
    box.appendChild(p); setTimeout(() => p.remove(), 700);
  }
}
const retrigger = (box, cls, ms) => { box.classList.remove(cls); void box.offsetWidth; box.classList.add(cls); setTimeout(() => box.classList.remove(cls), ms); };
export function hurt(box) { retrigger(box, "hurt", 500); play("bad"); }
export function flash(box) { retrigger(box, "flash", 650); play("ok"); }
