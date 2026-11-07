# 3D agents (trial: the panda)

The island map can show the student's agent as a real 3D model instead of the flat emoji-and-CSS one. This is a
trial with one animal, the panda. It is off by default; a student turns it on under **Agent ID → 3D agent (trial)**.
`panda-lab.html` shows the panda big, trotting and turning, and measures how fast it runs on the device you open it on.

## The pipeline

1. **Concept image** (optional). A drawing of the animal from the side, in our chibi style.
2. **Image to 3D** (optional). A tool like Tripo turns the drawing into a 3D model. Not used yet: it needs an
   account, and its price and licence for school use need checking first.
3. **Blender**. Shape, fix anatomy (the panda's tiny tail), split into parts and slim down.
   - `build_panda.py` builds the panda from simple shapes in code, so it can be rebuilt and tweaked exactly.
   - `slim_model.py` cuts any model down to a phone budget (default 6,000 triangles, 512 px textures).
     A 10.6 MB, 419,000-triangle test model came out at 151 KB and 5,991 triangles.
4. **Three.js** in the app (`js/kit/agent3d.js`) draws the model and animates it in code.

Run the scripts with Blender's Python module (`pip install bpy`, needs Python 3.13 for bpy 5.2) or with Blender
itself (`blender -b -P tools/panda/build_panda.py`).

## What a model needs

- A `.glb` file, under 150 KB (a test checks this) and at most 8,000 triangles.
- Facing +X (to the right), feet on the ground at height 0, about 1.4 units tall.
- Separate named parts so the app can animate them: `Body` (with `Head` as its child) and `LegFL`, `LegFR`,
  `LegBL`, `LegBR`, each with its origin where it bends (hips and neck).
- Colours as vertex colours (no textures), so the whole animal is a few draw calls.

Animals that do not walk on four legs (birds, sea animals, the octopus) would need their own parts and their own
movement in `agent3d.js`, in keeping with the rule that each animal moves in its own way.

## Cost on a phone

- Panda model: about 105 KB, 4,368 triangles, 6 draw calls.
- Three.js (vendored in `assets/vendor/three/`): about 200 KB gzipped, downloaded once, only when 3D is on.
- It draws at 30 frames a second when standing still, stops when the page is hidden, and frees its WebGL
  context when you leave the map.
