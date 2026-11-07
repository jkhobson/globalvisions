import { test } from "node:test";
import assert from "node:assert/strict";
import { BLOCKS, OBJECTIVES, TRAPS } from "../js/content/curriculum.js";
import { PACKS, WORLDS } from "../js/content/worlds.js";
import { TRUST_CARDS } from "../js/content/fizz.js";
// Every content pack (one per mission) is checked by the same rules.
const LOADED = await Promise.all(PACKS.map(n => import(`../js/content/${n}.js`)));
const ITEMS = LOADED.flatMap(p => p.ITEMS);
const SOURCES = Object.assign({}, ...LOADED.map(p => p.SOURCES));
const ORDER = ITEMS.filter(it => it.kind === "order"), CHOICE = ITEMS.filter(it => it.kind !== "order");

test("every item is complete", () => {
  const ids = new Set();
  for (const it of ITEMS) {
    assert.ok(!ids.has(it.id), `duplicate id ${it.id}`); ids.add(it.id);
    assert.ok(BLOCKS[it.block], `${it.id}: unknown block`);
    assert.ok(it.stem.simple && it.stem.std, `${it.id}: needs both stems`);
    assert.ok(it.hint && it.explain, `${it.id}: needs a hint and an explanation`);
    assert.ok([0, 1, 2].includes(it.demand), `${it.id}: demand`);
    if (it.source) assert.ok(SOURCES[it.source], `${it.id}: unknown source`);
    if (it.kind === "order") {
      assert.ok(it.parts.length >= 3 && it.parts.length <= 6, `${it.id}: a jumble needs 3 to 6 sentences`);
      it.parts.forEach(p => assert.ok(p.t && typeof p.why === "string" && p.why.length >= 15, `${it.id}: every sentence needs text and a why for its place`));
      assert.ok(!("options" in it), `${it.id}: a jumble has parts, not options`);
      continue;
    }
    assert.ok(it.options.length >= 3, `${it.id}: options`);
    assert.ok(!it.options[0].trap, `${it.id}: the right option (first) must not carry a trap`);
    it.options.slice(1).forEach(o => { if (o.trap) assert.ok(TRAPS[o.trap], `${it.id}: unknown trap ${o.trap}`); if (o.b) assert.ok(BLOCKS[o.b], `${it.id}: unknown gap block`); });
  }
});

test("the right answer is not usually the longest option", () => {
  for (const P of LOADED) {
    const items = P.ITEMS.filter(it => it.kind !== "order");
    const longest = items.filter(it => it.options.every((o, k) => k === 0 || it.options[0].t.length >= o.t.length)).length;
    assert.ok(longest / items.length <= 0.75, `${P.MISSION.id}: right answer is longest in ${longest} of ${items.length} items`);
  }
});

test("every block names real Stage 8 objective codes", () => {
  for (const [b, v] of Object.entries(BLOCKS)) v.objectives.forEach(o => assert.ok(OBJECTIVES[o], `${b}: ${o}`));
  assert.equal(Object.keys(OBJECTIVES).length, 18);
});

test("every source has a short and a long text, and every glossary word is defined", () => {
  for (const { SOURCES, GLOSSARY } of LOADED) for (const [id, s] of Object.entries(SOURCES)) {
    assert.ok(s.short && s.long && s.author && s.year, id);
    for (const m of (s.short + s.long).matchAll(/\*\*(.+?)\*\*/g)) assert.ok(GLOSSARY[m[1].toLowerCase()], `${id}: no glossary entry for ${m[1]}`);
    assert.ok(s.short.length < s.long.length, `${id}: short text should be shorter`);
  }
});

test("mission phases point at real items, with several versions of each question", () => {
  const used = new Set();
  for (const { MISSION, SOURCES } of LOADED) {
  assert.ok(WORLDS.some(w => w.id === MISSION.world && (w.missions || []).includes(MISSION.id)), `${MISSION.id}: its island lists it`);
  assert.ok(MISSION.places.filter(p => p.mission).length === 1, `${MISSION.id}: one place holds the mission`);
  MISSION.places.filter(p => p.source).forEach(p => assert.ok(SOURCES[p.source], `${MISSION.id}: place ${p.id} has an unknown source`));
  // a replay asks one version of every slot in one go, and the server saves at most 12 answers at a time
  assert.ok(MISSION.phases.reduce((n, p) => n + (p.items || []).length, 0) <= 12, `${MISSION.id}: at most 12 question slots`);
  MISSION.phases.forEach(p => (p.items || []).forEach(slot => {
    const versions = [].concat(slot);
    assert.ok(versions.length >= 3, `${versions[0]}: needs at least 3 versions so replays differ`);
    versions.forEach(i => { assert.ok(ITEMS.some(x => x.id === i), i); assert.ok(!used.has(i), `${i} is in two slots`); used.add(i); });
    const blocks = new Set(versions.map(i => ITEMS.find(x => x.id === i).block));
    assert.equal(blocks.size, 1, `${versions[0]}: all versions should practise the same block`);
  }));
  assert.ok(BLOCKS[MISSION.debrief.block]);
  }
});

test("Trust or Bust cards have reasons and known traps", () => {
  TRUST_CARDS.forEach(c => { assert.ok(c.why); if (c.trap) assert.ok(TRAPS[c.trap], c.trap); });
  assert.ok(TRUST_CARDS.some(c => c.ok) && TRUST_CARDS.some(c => !c.ok));
});

test("Research questions offered as the right answer are open, not yes/no", () => {
  CHOICE.filter(it => it.block.startsWith("R")).forEach(it => {
    const right = it.options[0].t.trim();
    if (right.endsWith("?")) assert.ok(!/^(is|are|do|does|did|should|can|could|will|would|has|have|was|were)\b/i.test(right), `${it.id}: right answer is a yes/no question`);
  });
});

test("every wrong option says why it is wrong, without giving the answer away", () => {
  for (const it of CHOICE) {
    assert.ok(!("why" in it.options[0]), `${it.id}: the right option needs no why`);
    for (const o of it.options.slice(1)) {
      assert.ok(typeof o.why === "string" && o.why.length >= 15 && o.why.length <= 140, `${it.id}: "${o.t}" needs a short why`);
      assert.ok(!o.why.includes(it.options[0].t), `${it.id}: a why must not quote the right answer`);
    }
  }
});

test("supabase/content.sql is up to date with the content", async () => {
  const { readFileSync } = await import("node:fs");
  const { contentSQL } = await import("../tools/content-sql.mjs");
  assert.equal(readFileSync(new URL("../supabase/content.sql", import.meta.url), "utf8"), await contentSQL(),
    "Run: node tools/content-sql.mjs > supabase/content.sql");
});

test("school-mode questions carry no answer key, and match the full content", async () => {
  const { readFileSync } = await import("node:fs");
  const { publicJS, publicOrder, publicParts } = await import("../tools/public-content.mjs");
  for (const name of PACKS) {
  assert.equal(readFileSync(new URL(`../js/content/${name}-public.js`, import.meta.url), "utf8"), await publicJS(name),
    "Run: node tools/public-content.mjs");
  const P = await import(`../js/content/${name}-public.js`);
  const keyWords = ["why", "trap", "explain", "ok", "b"];
  for (const it of P.ITEMS) {
    assert.ok(!keyWords.some(w => w in it), `${it.id} has a key field`);
    if (it.kind === "order") {
      for (const p of it.parts) assert.deepEqual(Object.keys(p), ["t"], `${it.id}: sentences must only have text`);
      const full = ITEMS.find(x => x.id === it.id), seq = publicParts(full).map(o => o.k);
      assert.deepEqual(it.parts.map(p => p.t), publicParts(full).map(o => o.t));
      assert.notDeepEqual(seq, full.parts.map((_, k) => k), `${it.id}: the jumble must not start in the right order`);
      continue;
    }
    for (const o of it.options) assert.deepEqual(Object.keys(o), ["t"], `${it.id}: options must only have text`);
    const full = ITEMS.find(x => x.id === it.id);
    assert.deepEqual(it.options.map(o => o.t), publicOrder(full).map(o => o.t));
    assert.deepEqual(it.options.map(o => o.t), [...it.options.map(o => o.t)].sort((a, b) => a.localeCompare(b, "en")), "alphabetical order");
  }
  for (const c of P.TRUST_CARDS || []) assert.deepEqual(Object.keys(c), ["t", "d"]);
  }
  // the right option isn't usually first in the public list (alphabetical order hides it)
  const firstRight = CHOICE.filter(it => publicOrder(it)[0].k === 0).length;
  assert.ok(firstRight < CHOICE.length / 2, `right option first in ${firstRight} of ${CHOICE.length}`);
});

test("Trust or Bust cards show the claim first and the deciding detail after it", () => {
  for (const c of TRUST_CARDS) {
    assert.ok(/^'.+'$/.test(c.t), `the claim is a quote: ${c.t}`);
    assert.ok(typeof c.d === "string" && c.d.length > 5, `a detail after the claim: ${c.t}`);
  }
});
