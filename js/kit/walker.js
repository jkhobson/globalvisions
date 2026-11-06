// The island scene: a tilted 3D island and the student's agent, who walks (arms and legs swinging) to wherever
// the student taps. Places stand up on the island like little signs. Used on the Map screen to move between
// missions and places. No libraries: CSS 3D for the ground, and the same perspective maths in JS to place
// the agent and the places on it, so they grow as they come towards you.
//
// mountIsland(host, { spots, avatar, start, onArrive, onMove }) returns { walkTo(id), destroy() }.
//   spots: [{ id, icon, name, x, y }] with x, y in 0..100 on the island (y = 0 is the far side).
const TILT = 52 * Math.PI / 180;     // how far the island is tipped back
const PERSPECTIVE = 900;             // px, the same as the CSS perspective below
const SPEED = 28;                    // island units per second
const ARRIVE = 10;                   // how close counts as "at" a place
const DEPTH = 1.7;                   // the island plane is this many times taller than the view (see .ground in CSS)

export function agentHTML(avatar) {
  return `<span class="agent3d" aria-hidden="true">
    <span class="a-shadow"></span>
    <span class="a-body">
      <span class="a-leg l"><span class="a-foot"></span></span><span class="a-leg r"><span class="a-foot"></span></span>
      <span class="a-arm l"><span class="a-hand"></span></span>
      <span class="a-coat"><span class="a-badge">★</span></span>
      <span class="a-arm r"><span class="a-hand"></span></span>
      <span class="a-head">${avatar}</span>
    </span></span>`;
}

export function mountIsland(host, { spots, avatar, start = { x: 50, y: 55 }, onArrive = () => {}, onMove = () => {} }) {
  host.innerHTML = `<div class="world" role="application" aria-label="Map of the island. Tap a place to walk there.">
      <div class="ground"><span class="beach"></span><span class="grass"></span><span class="path"></span></div>
      <div class="layer">${spots.map(s => `<button class="place" data-id="${s.id}" aria-label="Walk to ${s.name}"><span class="pi">${s.icon}</span><small>${s.name}</small></button>`).join("")}
        ${agentHTML(avatar)}</div>
    </div>`;
  const world = host.querySelector(".world"), layer = host.querySelector(".layer"), agent = host.querySelector(".agent3d");
  const els = Object.fromEntries([...layer.querySelectorAll(".place")].map(b => [b.dataset.id, b]));
  let pos = { ...start }, target = null, goal = null, raf = 0, last = 0, facing = 1, alive = true;

  // island coordinates -> screen position and size, matching the CSS rotateX + perspective of .ground
  function project(x, y) {
    const w = world.clientWidth, h = world.clientHeight;
    const u = (x / 100 - 0.5) * w, v = (y / 100 - 0.5) * h * DEPTH;
    const y3 = v * Math.cos(TILT), z3 = v * Math.sin(TILT);
    const k = PERSPECTIVE / (PERSPECTIVE - z3);
    return { left: w / 2 + u * k, top: h / 2 + y3 * k, k };
  }
  function put(el, x, y, size = 1) {
    const p = project(x, y);
    el.style.transform = `translate(${p.left}px, ${p.top}px) translate(-50%, -100%) scale(${(p.k * size).toFixed(3)})`;
    el.style.zIndex = String(Math.round(y * 10));
  }
  function layout() {
    spots.forEach(s => put(els[s.id], s.x, s.y));
    put(agent, pos.x, pos.y, 0.8);
    agent.style.setProperty("--face", facing);
  }
  const near = () => {                                          // the closest place, if the agent is at one
    const d = s => Math.hypot(s.x - pos.x, s.y - pos.y), best = spots.reduce((a, b) => d(a) <= d(b) ? a : b);
    return d(best) < ARRIVE ? best : null;
  };
  function mark() {
    const n = near();
    Object.values(els).forEach(e => e.classList.toggle("here", !!n && e.dataset.id === n.id));
    return n;
  }
  function step(t) {
    if (!alive) return;
    const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
    const dx = target.x - pos.x, dy = target.y - pos.y, d = Math.hypot(dx, dy), move = SPEED * dt;
    if (Math.abs(dx) > 0.5) facing = dx < 0 ? -1 : 1;
    agent.classList.toggle("away", dy < -Math.abs(dx));            // walking away from you: show the back
    if (d <= move) { pos = { ...target }; layout(); stop(); return; }
    pos = { x: pos.x + dx / d * move, y: pos.y + dy / d * move };
    layout(); raf = requestAnimationFrame(step);
  }
  function stop() {
    cancelAnimationFrame(raf); agent.classList.remove("walking", "away"); last = 0;
    onMove(pos);
    const n = mark();
    if (n && goal === n.id) onArrive(n);
    goal = null;
  }
  function walk(x, y, id = null) {
    target = { x: Math.max(4, Math.min(96, x)), y: Math.max(6, Math.min(96, y)) }; goal = id;
    if (reduced()) { pos = { ...target }; layout(); return stop(); }
    cancelAnimationFrame(raf); last = 0; agent.classList.add("walking"); raf = requestAnimationFrame(step);
  }
  const reduced = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const walkTo = id => { const s = spots.find(p => p.id === id); if (s) walk(s.x + 6, s.y + 5, s.id); };

  // tap a place, or tap the ground to walk there (inverse of project(), solved for the island point)
  layer.querySelectorAll(".place").forEach(b => b.onclick = e => { e.stopPropagation(); walkTo(b.dataset.id); });
  world.addEventListener("click", e => {
    if (e.target.closest(".place")) return;
    const r = world.getBoundingClientRect(), w = r.width, h = r.height;
    const sx = e.clientX - r.left - w / 2, sy = e.clientY - r.top - h / 2;
    const v = sy * PERSPECTIVE / (PERSPECTIVE * Math.cos(TILT) + sy * Math.sin(TILT)), k = PERSPECTIVE / (PERSPECTIVE - v * Math.sin(TILT));
    walk((sx / k / w + 0.5) * 100, (v / (h * DEPTH) + 0.5) * 100);
  });
  const keys = e => {
    if (!document.body.contains(world)) return destroy();
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
    const d = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, -8], ArrowDown: [0, 8] }[e.key];
    if (d) { e.preventDefault(); walk(pos.x + d[0], pos.y + d[1]); }
  };
  document.addEventListener("keydown", keys);
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(layout) : null;
  if (ro) ro.observe(world); else window.addEventListener("resize", layout);
  function destroy() { alive = false; cancelAnimationFrame(raf); document.removeEventListener("keydown", keys); if (ro) ro.disconnect(); }
  layout(); mark();
  return { walkTo, destroy, here: () => mark() };
}
