// Real 3D agents for the island map. Each animal is a small glTF model (built by tools/agents/build_agents.py)
// drawn with Three.js in a canvas inside the agent the walker already moves, so walking, tapping and saving the
// position all stay the same. The models' parts (body, head, legs, wings, fins, tail, arms) are animated here in
// code, and every animal moves in its own way, matching the walker's kinds: the fox, panda and tiger trot, the
// turtle plods, birds hop, sea animals swim, the butterfly flutters, the octopus squishes, the hedgehog scurries
// and the lizard wiggles. Standing still, they breathe and look around.
//
// Light on phones: Three.js and the model are only fetched when this runs (one model, about 100 KB), the canvas
// is tiny, it draws at most 30 frames a second when standing still, it stops drawing when the page is hidden, and
// it frees its WebGL context when the map goes away. If anything fails (old browser, no WebGL, file blocked), the
// flat CSS agent stays.
//
// mountAgent3D(agentEl, { model, move, onStats }) -> Promise<{ destroy() } | null>
//   model: URL of a .glb (or its bytes as an ArrayBuffer), facing +X, with parts named as in build_agents.py.
//   move: how it moves (trot, plod, hop, swim, flutter, squish, scurry, wiggle), from walker.js KINDS.
//   onStats: optional callback with { bytes, tris, calls, loadMs } once it is ready (for the lab page).
const VENDOR = new URL("../../assets/vendor/three/", import.meta.url);
const NAMES = { "🦊": "fox", "🐼": "panda", "🐢": "turtle", "🦉": "owl", "🐬": "dolphin", "🦋": "butterfly",
  "🐯": "tiger", "🦜": "parrot", "🐙": "octopus", "🦔": "hedgehog", "🐳": "whale", "🦎": "lizard" };
export const MODELS = Object.fromEntries(Object.entries(NAMES).map(([a, n]) => [a, new URL(`../../assets/models/${n}.glb`, import.meta.url).href]));

export function canUse3D() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch { return false; }
}

// Steps (or flaps, or strokes) per second while walking.
const FREQ = { trot: 3.2, plod: 1.4, hop: 2.2, swim: 1.6, flutter: 5, squish: 2.2, scurry: 6, wiggle: 3 };

export async function mountAgent3D(el, { model, move = "trot", onStats = () => {} } = {}) {
  if (!el || !model || !canUse3D()) return null;
  const t0 = performance.now();
  let THREE, GLTFLoader, buf;
  try {
    [THREE, { GLTFLoader }, buf] = await Promise.all([
      import(new URL("three.module.min.js", VENDOR).href),
      import(new URL("GLTFLoader.js", VENDOR).href),
      typeof model !== "string" ? model
        : fetch(model).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    ]);
  } catch (e) { console.warn("3D agent not loaded:", e); return null; }
  if (!el.isConnected) return null;

  const gltf = await new Promise((ok, bad) => new GLTFLoader().parse(buf, "", ok, bad)).catch(() => null);
  if (!gltf || !el.isConnected) return null;

  const canvas = document.createElement("canvas");
  canvas.className = "a-3d";
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
  } catch { return null; }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9ab07a, 2.4));
  const sun = new THREE.DirectionalLight(0xffffff, 1.8); sun.position.set(-1.5, 3, 2.5); scene.add(sun);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  camera.position.set(0, 1.3, 3.9); camera.lookAt(0, 0.55, 0);

  // Cheap shading for phones: one Lambert material that uses the model's vertex colours.
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  let tris = 0;
  gltf.scene.traverse(o => {
    if (!o.isMesh) return;
    o.material = mat;
    tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3;
  });

  // Fit every animal to about the same size and centre it over its feet (the lizard is long, the owl is tall).
  const box = new THREE.Box3().setFromObject(gltf.scene), size = box.getSize(new THREE.Vector3());
  const fit = Math.min(1.2, 1.3 / Math.max(size.y, size.x * 0.68, size.z * 0.68));
  gltf.scene.scale.setScalar(fit);
  gltf.scene.position.set(-(box.min.x + box.max.x) / 2 * fit, 0, -(box.min.z + box.max.z) / 2 * fit);
  const turn = new THREE.Group(), rig = new THREE.Group();   // turn: which way it faces; rig: hops and floats
  rig.add(gltf.scene); turn.add(rig); scene.add(turn);

  // A soft shadow under the animal, in 3D, so it clearly stands on (or floats above) the ground from every side.
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.5, 24), shadowMat);
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.002;
  shadow.scale.set(Math.max(0.8, size.x * fit * 0.95), Math.max(0.6, size.z * fit * 0.8), 1);
  turn.add(shadow);

  // The parts each movement uses, and their rest poses (every frame starts from rest, so nothing drifts).
  const part = n => gltf.scene.getObjectByName(n) || null;
  const P = {
    body: part("Body"), head: part("Head"), tail: part("Tail"),
    legs: ["LegFL", "LegFR", "LegBL", "LegBR"].map(part), wings: ["WingL", "WingR"].map(part),
    fins: ["FinL", "FinR"].map(part), feet: ["FootL", "FootR"].map(part),
    arms: Array.from({ length: 8 }, (_, i) => part(`Arm${i}`))
  };
  const all = [P.body, P.head, P.tail, ...P.legs, ...P.wings, ...P.fins, ...P.feet, ...P.arms].filter(Boolean);
  const rest = new Map(all.map(o => [o, { p: o.position.clone(), q: o.quaternion.clone(), s: o.scale.clone() }]));
  // Octopus arms curl up and down around the line across their base.
  const armAxis = P.arms.map(a => a && new THREE.Vector3(-a.position.z, 0, a.position.x).normalize());
  const q = new THREE.Quaternion();

  function pose(go, ph, k, still) {
    for (const [o, r] of rest) { o.position.copy(r.p); o.quaternion.copy(r.q); o.scale.copy(r.s); }
    rig.position.y = 0; rig.scale.set(1, 1, 1);
    if (still) { if (move === "swim") rig.position.y = 0.12; if (move === "flutter") rig.position.y = 0.08; return; }
    const s = Math.sin(ph), c = Math.cos(ph), idle = 1 - go;
    const { body, head, tail, legs, wings, fins, feet, arms } = P;
    const swing = (amp, pairs = true) => legs.forEach((l, i) => { if (l) l.rotation.z += (pairs ? ((i === 0 || i === 3) ? s : -s) : s) * amp * go; });
    const breathe = a => { if (body) body.scale.y *= 1 + Math.sin(k * 2.4) * a * idle; };
    const look = a => { if (head) { head.rotation.y += Math.sin(k * 0.5) * a * idle; head.rotation.z += Math.sin(k * 0.8) * 0.05 * idle; } };

    switch (move) {
      case "trot":
        swing(0.22); breathe(0.018); look(0.25);
        if (body) { body.position.y += Math.abs(c) * 0.02 * go; body.rotation.x += s * 0.03 * go; }
        if (head) { head.rotation.z += Math.cos(ph * 2) * 0.04 * go; head.rotation.x += s * 0.04 * go; }
        if (tail) tail.rotation.y += Math.sin(k * 3) * (0.25 + 0.3 * go);           // wag, faster when happy
        break;
      case "scurry":                                                                // tiny legs, very fast
        swing(0.4); breathe(0.03);
        if (body) body.position.y += Math.abs(c) * 0.015 * go;
        if (head) head.rotation.z += Math.sin(k * 9) * 0.04 * idle + s * 0.03 * go;  // sniff, sniff
        break;
      case "plod":                                                                  // slow and steady
        swing(0.28); breathe(0.012);
        if (body) body.rotation.x += s * 0.06 * go;
        if (head) head.position.x += (Math.sin(k * 0.7) * 0.05 * idle + Math.abs(s) * 0.03 * go);  // head in and out
        break;
      case "wiggle":                                                                // a gecko's side-to-side walk
        swing(0.4);
        if (body) { body.rotation.y += s * 0.25 * go; body.position.y += Math.pow(Math.max(0, Math.sin(k * 1.6)), 6) * 0.04 * idle; }
        if (head) head.rotation.y += -s * 0.18 * go + Math.sin(k * 0.6) * 0.2 * idle;
        if (tail) tail.rotation.y += -Math.sin(ph - 0.8) * 0.45 * go + Math.sin(k * 1.2) * 0.12 * idle;
        break;
      case "hop": {                                                                 // birds hop with both feet
        const h = Math.abs(s);
        rig.position.y += h * 0.22 * go;
        rig.scale.y = 1 - Math.pow(1 - h, 8) * 0.08 * go;                             // squash on landing
        const flap = 0.15 + 0.7 * h * go + Math.max(0, Math.sin(k * 0.9)) * 0.1 * idle;
        if (wings[0]) wings[0].rotation.x += flap;
        if (wings[1]) wings[1].rotation.x -= flap;
        feet.forEach(f => { if (f) f.rotation.z += -h * 0.5 * go; });
        if (head) head.rotation.y += Math.sin(k * 0.45) * 0.7 * idle;               // owls (and parrots) look around
        breathe(0.02);
        break;
      }
      case "swim":                                                                  // floats and swims through the air
        rig.position.y += 0.12 + Math.sin(k * 1.6) * 0.04;
        if (body) body.rotation.z += s * 0.12 * go;
        if (tail) tail.rotation.z += Math.sin(ph - 1) * 0.5 * go + Math.sin(k * 1.6) * 0.15 * idle;
        if (fins[0]) fins[0].rotation.x += 0.2 + Math.sin(ph) * 0.25 * go + Math.sin(k) * 0.1 * idle;
        if (fins[1]) fins[1].rotation.x -= 0.2 + Math.sin(ph) * 0.25 * go + Math.sin(k) * 0.1 * idle;
        break;
      case "flutter": {
        rig.position.y += 0.08 + Math.sin(k * 2) * 0.06 + Math.sin(ph * 0.4) * 0.05 * go;
        const f = go > 0.5 ? ph : k * 1.3 * Math.PI;                                // fast flaps flying, slow at rest
        const a = 0.45 + 0.8 * (0.5 + 0.5 * Math.sin(f));            // always a V, so the wings show
        if (wings[0]) wings[0].rotation.x += a;
        if (wings[1]) wings[1].rotation.x -= a;
        if (body) body.rotation.z += 0.12 * go;
        break;
      }
      case "squish": {                                                              // the octopus squishes along
        const sq = Math.sin(ph) * go + Math.sin(k * 1.4) * 0.3 * idle;
        if (body) body.scale.set(1 + sq * 0.07, 1 - sq * 0.1, 1 + sq * 0.07);
        rig.position.y += Math.max(0, -Math.cos(ph)) * 0.05 * go;
        arms.forEach((a, i) => {
          if (!a) return;
          const lift = Math.sin(k * 1.8 + i * 0.8) * 0.12 * idle + Math.sin(ph + i * 0.785) * 0.35 * go;
          a.quaternion.multiply(q.setFromAxisAngle(armAxis[i], lift));
        });
        break;
      }
    }
  }

  el.classList.add("has3d");
  el.querySelector(".a-body")?.after(canvas);

  const reduced = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let yaw = -0.5, phase = 0, go = 0, last = 0, lastDraw = 0, raf = 0, alive = true, px = 0;

  function resize() {
    const s = Math.round(canvas.clientWidth || 80);
    if (s !== px) { px = s; renderer.setSize(s, s, false); }
  }
  function frame(t) {
    if (!alive) return;
    if (!el.isConnected) return destroy();
    raf = requestAnimationFrame(frame);
    if (document.hidden) { last = t; return; }
    const walking = el.classList.contains("walking");
    if (!walking && go < 0.01 && t - lastDraw < 33) return;   // standing still: 30 fps is plenty
    const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t; lastDraw = t;
    resize();

    // Turn to face where the walker is heading (dx right, dy towards you), easing round the short way.
    const h = el.dataset.heading;
    if (h !== undefined && walking) {
      const [dx, dy] = h.split(",").map(Number);
      let d = Math.atan2(-dy, dx) - yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      yaw += d * Math.min(1, dt * 10);
    }
    turn.rotation.y = yaw;
    go += ((walking ? 1 : 0) - go) * Math.min(1, dt * 8);      // ease between walking and standing
    phase += dt * 2 * Math.PI * (FREQ[move] || 3) * go;
    pose(go, phase, t / 1000, reduced());
    renderer.render(scene, camera);
  }
  function destroy() {
    if (!alive) return;
    alive = false; cancelAnimationFrame(raf);
    gltf.scene.traverse(o => { if (o.isMesh) o.geometry.dispose(); });
    mat.dispose(); shadow.geometry.dispose(); shadowMat.dispose(); renderer.dispose(); renderer.forceContextLoss();
    canvas.remove(); el.classList.remove("has3d");
  }
  resize(); pose(0, 0, 0, reduced()); renderer.render(scene, camera);
  raf = requestAnimationFrame(frame);
  onStats({ bytes: buf.byteLength, tris: Math.round(tris), calls: renderer.info.render.calls, loadMs: Math.round(performance.now() - t0) });
  return { destroy, renderer };
}
