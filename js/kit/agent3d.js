// A real 3D agent for the island map (a trial, panda first). It draws a small glTF model with Three.js in a
// canvas inside the agent the walker already moves, so walking, tapping and saving the position all stay the
// same. The model's legs, body and head are separate parts and are animated here in code: a trot while the
// walker says "walking", and breathing and a slow head tilt while standing still.
//
// Light on phones: Three.js and the model are only fetched when this runs, the canvas is tiny, it draws at most
// 30 frames a second when standing still, it stops drawing when the page is hidden, and it frees its WebGL
// context when the map goes away. If anything fails (old browser, no WebGL, file blocked), the CSS agent stays.
//
// mountAgent3D(agentEl, { model, onStats }) -> Promise<{ destroy() } | null>
//   model: URL of a .glb (or its bytes as an ArrayBuffer) with nodes Body (with child Head) and LegFL, LegFR, LegBL, LegBR, facing +X.
//   onStats: optional callback with { bytes, tris, calls, loadMs } once it is ready (for the lab page).
const VENDOR = new URL("../../assets/vendor/three/", import.meta.url);

export const MODELS = { "🐼": new URL("../../assets/models/panda.glb", import.meta.url).href };

export function canUse3D() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch { return false; }
}

export async function mountAgent3D(el, { model, onStats = () => {} } = {}) {
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
  camera.position.set(0, 1.55, 3.9); camera.lookAt(0, 0.62, 0);

  // Cheap shading for phones: one Lambert material that uses the model's vertex colours.
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  let tris = 0;
  gltf.scene.traverse(o => {
    if (!o.isMesh) return;
    o.material = mat;
    tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3;
  });
  const panda = new THREE.Group(); panda.add(gltf.scene); scene.add(panda);
  gltf.scene.position.x = -0.12;                         // the head sticks out in front: centre the whole animal
  const part = n => gltf.scene.getObjectByName(n);
  const body = part("Body"), head = part("Head"), legs = ["LegFL", "LegFR", "LegBL", "LegBR"].map(part);
  const rest = { bodyY: body ? body.position.y : 0 };

  el.classList.add("has3d");
  el.querySelector(".a-body")?.after(canvas);

  const reduced = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let yaw = -0.5, phase = 0, last = 0, lastDraw = 0, raf = 0, alive = true, size = 0;

  function fit() {
    const s = Math.round(canvas.clientWidth || 80);
    if (s !== size) { size = s; renderer.setSize(s, s, false); }
  }
  function frame(t) {
    if (!alive) return;
    if (!el.isConnected) return destroy();
    raf = requestAnimationFrame(frame);
    if (document.hidden) { last = t; return; }
    const walking = el.classList.contains("walking");
    if (!walking && t - lastDraw < 33) return;           // standing still: 30 fps is plenty
    const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t; lastDraw = t;
    fit();

    // Turn to face where the walker is heading (dx right, dy towards you), easing round the short way.
    const h = el.dataset.heading;
    if (h !== undefined && walking) {
      const [dx, dy] = h.split(",").map(Number);
      const want = Math.atan2(-dy, dx);
      let d = want - yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      yaw += d * Math.min(1, dt * 10);
    }
    panda.rotation.y = yaw;

    const still = reduced();
    if (walking && !still) {
      phase += dt * 2 * Math.PI * 3.2;                   // about 3 steps a second: a short-legged trot
      const s = Math.sin(phase), sw = 0.25;          // a small swing keeps short legs tucked under the body
      if (legs[0]) legs[0].rotation.z = s * sw;          // diagonal pairs move together
      if (legs[3]) legs[3].rotation.z = s * sw;
      if (legs[1]) legs[1].rotation.z = -s * sw;
      if (legs[2]) legs[2].rotation.z = -s * sw;
      if (body) { body.position.y = rest.bodyY + Math.abs(Math.cos(phase)) * 0.02; body.rotation.x = s * 0.03; body.scale.y = 1; }
      if (head) { head.rotation.z = Math.cos(phase * 2) * 0.04; head.rotation.x = s * 0.05; }
    } else {
      const k = t / 1000;
      legs.forEach(l => { if (l) l.rotation.z *= 0.8; });
      if (body) { body.position.y = rest.bodyY; body.rotation.x = 0; body.scale.y = still ? 1 : 1 + Math.sin(k * 2.4) * 0.018; }
      if (head) { head.rotation.z = still ? 0 : Math.sin(k * 0.9) * 0.05; head.rotation.x = still ? 0 : Math.sin(k * 0.6) * 0.09; }
    }
    renderer.render(scene, camera);
  }
  function destroy() {
    if (!alive) return;
    alive = false; cancelAnimationFrame(raf);
    gltf.scene.traverse(o => { if (o.isMesh) o.geometry.dispose(); });
    mat.dispose(); renderer.dispose(); renderer.forceContextLoss();
    canvas.remove(); el.classList.remove("has3d");
  }
  fit(); renderer.render(scene, camera);
  raf = requestAnimationFrame(frame);
  onStats({ bytes: buf.byteLength, tris: Math.round(tris), calls: renderer.info.render.calls, loadMs: Math.round(performance.now() - t0) });
  return { destroy, renderer };
}
