# Three.js (vendored)

Three.js r170 (npm `three@0.170.0`), MIT licence (see LICENSE). Copied here so the app has no build step and no
CDN dependency (school networks can block CDNs). Only loaded by `js/kit/agent3d.js`, and only when a 3D agent is on.

- `three.module.min.js` from `build/`
- `GLTFLoader.js` from `examples/jsm/loaders/`, `BufferGeometryUtils.js` from `examples/jsm/utils/`.
  Their `import ... from 'three'` lines were changed to `./three.module.min.js` (and `../utils/` to `./`) so they
  work without an import map. Nothing else was changed.
