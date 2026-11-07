// The 3D agent models must stay light enough for phones and have the parts the app animates for their movement.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { KINDS } from "../js/kit/walker.js";

const MAX_BYTES = 150 * 1024;   // one agent model; Three.js itself is about 200 KB gzipped on top
const MAX_TRIS = 8000;
const NAMES = { "🦊": "fox", "🐼": "panda", "🐢": "turtle", "🦉": "owl", "🐬": "dolphin", "🦋": "butterfly",
  "🐯": "tiger", "🦜": "parrot", "🐙": "octopus", "🦔": "hedgehog", "🐳": "whale", "🦎": "lizard" };
const LEGS = ["LegFL", "LegFR", "LegBL", "LegBR"];
// What each way of moving needs (see js/kit/agent3d.js).
// (The panda has no Tail part: its tiny stub tail is part of the body and does not wag.)
const NEEDS = {
  trot: ["Body", "Head", ...LEGS], plod: ["Body", "Head", ...LEGS], scurry: ["Body", "Head", ...LEGS],
  wiggle: ["Body", "Head", "Tail", ...LEGS], hop: ["Body", "Head", "WingL", "WingR", "FootL", "FootR"],
  swim: ["Body", "Tail", "FinL", "FinR"], flutter: ["Body", "WingL", "WingR"],
  squish: ["Body", ...Array.from({ length: 8 }, (_, i) => `Arm${i}`)]
};

function readGlb(path) {
  const buf = readFileSync(path);
  assert.equal(buf.toString("ascii", 0, 4), "glTF", "not a .glb file");
  const len = buf.readUInt32LE(12);
  return { bytes: buf.length, json: JSON.parse(buf.toString("utf8", 20, 20 + len)) };
}

for (const [avatar, name] of Object.entries(NAMES)) {
  test(`${name} model is small, has the parts for how it moves, and needs no textures`, () => {
    const { bytes, json } = readGlb(new URL(`../assets/models/${name}.glb`, import.meta.url));
    assert.ok(bytes < MAX_BYTES, `${name}.glb is ${bytes} bytes`);
    const move = KINDS[avatar].move, names = json.nodes.map(n => n.name);
    for (const p of NEEDS[move]) assert.ok(names.includes(p), `${name} (${move}) is missing ${p}`);
    const node = n => json.nodes.find(x => x.name === n), idx = n => json.nodes.indexOf(node(n));
    for (const k of ["Head", "Tail", "WingL", "WingR", "FinL", "FinR", "Arm0"])
      if (node(k)) assert.ok((node("Body").children || []).includes(idx(k)), `${k} should move with the Body`);
    if (names.includes("LegFL")) {
      // each leg sits at its own corner (a leg left at 0, 0, 0 hangs out of the belly)
      const legs = LEGS.map(n => node(n).translation || [0, 0, 0]);
      const corners = new Set(legs.map(([x, , z]) => `${Math.sign(x)},${Math.sign(z)}`));
      assert.equal(corners.size, 4, `${name} legs at ${JSON.stringify(legs)}`);
    }
    const tris = json.meshes.flatMap(m => m.primitives).reduce((s, p) => s + json.accessors[p.indices].count / 3, 0);
    assert.ok(tris <= MAX_TRIS, `${name}: ${tris} triangles`);
    assert.ok(!json.images || json.images.length === 0, "colours should be vertex colours, not textures");
  });
}
