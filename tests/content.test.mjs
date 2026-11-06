import { test } from "node:test";
import assert from "node:assert/strict";
import { BLOCKS, OBJECTIVES, TRAPS } from "../js/content/curriculum.js";
import { ITEMS, SOURCES, MISSION, GLOSSARY, TRUST_CARDS } from "../js/content/fizz.js";

test("every item is complete", () => {
  const ids = new Set();
  for (const it of ITEMS) {
    assert.ok(!ids.has(it.id), `duplicate id ${it.id}`); ids.add(it.id);
    assert.ok(BLOCKS[it.block], `${it.id}: unknown block`);
    assert.ok(it.stem.simple && it.stem.std, `${it.id}: needs both stems`);
    assert.ok(it.hint && it.explain, `${it.id}: needs a hint and an explanation`);
    assert.ok([0, 1, 2].includes(it.demand), `${it.id}: demand`);
    assert.ok(it.options.length >= 3, `${it.id}: options`);
    assert.ok(!it.options[0].trap, `${it.id}: the right option (first) must not carry a trap`);
    it.options.slice(1).forEach(o => { if (o.trap) assert.ok(TRAPS[o.trap], `${it.id}: unknown trap ${o.trap}`); if (o.b) assert.ok(BLOCKS[o.b], `${it.id}: unknown gap block`); });
    if (it.source) assert.ok(SOURCES[it.source], `${it.id}: unknown source`);
  }
});

test("the right answer is not usually the longest option", () => {
  const longest = ITEMS.filter(it => it.options.every((o, k) => k === 0 || it.options[0].t.length >= o.t.length)).length;
  assert.ok(longest / ITEMS.length <= 0.75, `right answer is longest in ${longest} of ${ITEMS.length} items`);
});

test("every block names real Stage 8 objective codes", () => {
  for (const [b, v] of Object.entries(BLOCKS)) v.objectives.forEach(o => assert.ok(OBJECTIVES[o], `${b}: ${o}`));
  assert.equal(Object.keys(OBJECTIVES).length, 18);
});

test("every source has a short and a long text, and every glossary word is defined", () => {
  for (const [id, s] of Object.entries(SOURCES)) {
    assert.ok(s.short && s.long && s.author && s.year, id);
    for (const m of (s.short + s.long).matchAll(/\*\*(.+?)\*\*/g)) assert.ok(GLOSSARY[m[1].toLowerCase()], `${id}: no glossary entry for ${m[1]}`);
    assert.ok(s.short.length < s.long.length, `${id}: short text should be shorter`);
  }
});

test("mission phases point at real items, with several versions of each question", () => {
  const used = new Set();
  MISSION.phases.forEach(p => (p.items || []).forEach(slot => {
    const versions = [].concat(slot);
    assert.ok(versions.length >= 3, `${versions[0]}: needs at least 3 versions so replays differ`);
    versions.forEach(i => { assert.ok(ITEMS.some(x => x.id === i), i); assert.ok(!used.has(i), `${i} is in two slots`); used.add(i); });
    const blocks = new Set(versions.map(i => ITEMS.find(x => x.id === i).block));
    assert.equal(blocks.size, 1, `${versions[0]}: all versions should practise the same block`);
  }));
  assert.ok(BLOCKS[MISSION.debrief.block]);
});

test("Trust or Bust cards have reasons and known traps", () => {
  TRUST_CARDS.forEach(c => { assert.ok(c.why); if (c.trap) assert.ok(TRAPS[c.trap], c.trap); });
  assert.ok(TRUST_CARDS.some(c => c.ok) && TRUST_CARDS.some(c => !c.ok));
});

test("Research questions offered as the right answer are open, not yes/no", () => {
  ITEMS.filter(it => it.block.startsWith("R")).forEach(it => {
    const right = it.options[0].t.trim();
    if (right.endsWith("?")) assert.ok(!/^(is|are|do|does|did|should|can|could|will|would|has|have|was|were)\b/i.test(right), `${it.id}: right answer is a yes/no question`);
  });
});
