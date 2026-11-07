// The 3D agent models must stay light enough for phones and have the parts the app animates.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const MAX_BYTES = 150 * 1024;   // one agent model; Three.js itself is about 200 KB gzipped on top
const MAX_TRIS = 8000;
const PARTS = ["Body", "Head", "LegFL", "LegFR", "LegBL", "LegBR"];

function readGlb(path) {
  const buf = readFileSync(path);
  assert.equal(buf.toString("ascii", 0, 4), "glTF", "not a .glb file");
  const len = buf.readUInt32LE(12);
  return { bytes: buf.length, json: JSON.parse(buf.toString("utf8", 20, 20 + len)) };
}

test("panda model is small, has the animated parts, and needs no textures", () => {
  const { bytes, json } = readGlb(new URL("../assets/models/panda.glb", import.meta.url));
  assert.ok(bytes < MAX_BYTES, `panda.glb is ${bytes} bytes`);
  const names = json.nodes.map(n => n.name);
  for (const p of PARTS) assert.ok(names.includes(p), `missing part ${p}`);
  const head = json.nodes.find(n => n.name === "Head"), body = json.nodes.find(n => n.name === "Body");
  assert.ok((body.children || []).includes(json.nodes.indexOf(head)), "Head should be a child of Body so it bobs with it");
  const tris = json.meshes.flatMap(m => m.primitives).reduce((s, p) => s + json.accessors[p.indices].count / 3, 0);
  assert.ok(tris <= MAX_TRIS, `${tris} triangles`);
  assert.ok(!json.images || json.images.length === 0, "colours should be vertex colours, not textures");
});
