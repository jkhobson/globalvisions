# 3D agents

On the island map, each student's agent is a real 3D animal. All twelve are built in code in Blender, saved as
small `.glb` files in `assets/models/`, and drawn and animated with Three.js by `js/kit/agent3d.js`. Each animal
moves in its own way, matching `KINDS` in `js/kit/walker.js`:

| Animal | Moves by | Parts that move |
| --- | --- | --- |
| fox, tiger | trot | legs in diagonal pairs, head nod, tail wag |
| panda | trot | legs, head nod (its tiny stub tail does not wag) |
| turtle | plod | slow legs, body rock, head in and out |
| hedgehog | scurry | tiny fast legs, sniffing nose |
| lizard | wiggle | body and tail sway side to side, push-ups when still |
| owl, parrot | hop | both feet together, wings flap, head turns to look around |
| dolphin, whale | swim | floats, body and tail beat up and down, fins paddle |
| butterfly | flutter | floats, wings flap fast when flying and slowly at rest |
| octopus | squish | body squashes and stretches, eight tentacles ripple |

3D is on by default. A student can turn it off on Agent ID, and anyone whose device can't do 3D keeps the flat
agent. `agents-lab.html` shows every animal big and on an island, with file size, load time and frame rate.

## The pipeline

1. **Concept image** (optional). A drawing of the animal from the side, in our chibi style.
2. **Image to 3D** (optional). A tool like Tripo turns the drawing into a 3D model. Not used yet: it needs an
   account, and its price and licence for school use need checking first.
3. **Blender**. Shape, fix anatomy (the panda's tiny tail), split into parts and slim down.
   - `build_agents.py` builds every animal from simple shapes in code, so each can be rebuilt and tweaked exactly:
     `python tools/agents/build_agents.py` (all) or `python tools/agents/build_agents.py panda owl` (some).
   - `slim_model.py` cuts any model down to a phone budget (default 6,000 triangles, 512 px textures).
     A 10.6 MB, 419,000-triangle test model came out at 151 KB and 5,991 triangles.
4. **Three.js** in the app (`js/kit/agent3d.js`) draws the model and animates its parts in code.

Run the scripts with Blender's Python module (`pip install bpy`, needs Python 3.13 for bpy 5.2) or with Blender
itself (`blender -b -P tools/agents/build_agents.py -- panda`).

## What a model needs

- A `.glb` file, under 150 KB and at most 8,000 triangles (`tests/model.test.mjs` checks every animal).
- Facing +X (to the right), feet (or lowest point) on the ground at height 0.
- Separate named parts with their origins where they bend, the ones its movement uses: `Body` (with `Head`,
  `Tail`, `WingL`/`WingR`, `FinL`/`FinR` or `Arm0`-`Arm7` as children) and `LegFL`, `LegFR`, `LegBL`, `LegBR`
  or `FootL`, `FootR` on the ground. A model from an image-to-3D tool usually comes as one piece, so this
  splitting is done by hand in Blender.
- Colours as vertex colours (no textures), so the whole animal is a few draw calls.

## Cost on a phone

- One model, the student's own: 63 to 125 KB, 2,200 to 5,600 triangles, about 10 draw calls.
- Three.js (vendored in `assets/vendor/three/`): about 200 KB gzipped, downloaded once, only on the island map.
- It draws at 30 frames a second when standing still, stops when the page is hidden, and frees its WebGL
  context when you leave the map.
