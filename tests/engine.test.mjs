import { test } from "node:test";
import assert from "node:assert/strict";
import { mastery, applyAnswer, nextBlock, rank, nextDemand, nextSupport, answerXP, wrapping, P_START, trapCounts } from "../js/engine.js";

const at = (answers, t = "2026-11-06T01:00:00Z") => ({ text_id: "x", created_at: t, answers });
const right = (block, demand = 0) => ({ block, demand, support: "none" });

test("right first time raises mastery, and prerequisites a little", () => {
  const p = mastery([at([right("E2")])]);
  assert.ok(p.E2 > P_START);
  assert.ok(p.E1 > P_START && p.E1 < p.E2);
});

test("a language-barrier answer changes nothing", () => {
  const p = mastery([at([{ block: "E1", support: "none", barrier: "language" }])]);
  assert.equal(p.E1, P_START);
});

test("a wrong answer lowers mastery and the gap block it points to", () => {
  const p = mastery([at([{ block: "E3", support: "explained", gap: "E1" }])]);
  assert.ok(p.E3 < P_START);
  assert.ok(p.E1 < P_START);
});

test("blocks unlock in order: E1 first, E2 after E1 is mastered", () => {
  let p = mastery([]);
  assert.equal(nextBlock(p, "Evaluation"), "E1");
  p = mastery([at(Array(6).fill(right("E1")))]);
  assert.ok(["E2", "E3"].includes(nextBlock(p, "Evaluation")));
});

test("rank grows with blocks mastered", () => {
  assert.equal(rank(mastery([]), "Evaluation").name, "Explorer");
  const all = ["E1", "E2", "E3", "E4", "E5"].flatMap(b => Array(8).fill(right(b)));
  assert.equal(rank(mastery([at(all)]), "Evaluation").name, "Ambassador");
  assert.equal(rank(mastery([]), "Collaboration"), null);
});

test("demand: 2 right first time up, 2 missed down, never outside 0..2", () => {
  assert.equal(nextDemand(0, [right("E1"), right("E1")]), 1);
  assert.equal(nextDemand(2, [right("E1"), right("E1")]), 2);
  assert.equal(nextDemand(1, [{ support: "explained" }, { support: "explained" }]), 0);
  assert.equal(nextDemand(1, [right("E1"), { support: "hint" }]), 1);
});

test("support dial: fades after 3 tasks without help, catches after 2 heavy-help tasks", () => {
  assert.deepEqual(nextSupport(1, [{ help: 0 }, { help: 0 }, { help: 0 }]), { level: 2, change: "less" });
  assert.deepEqual(nextSupport(2, [{ help: 4 }, { help: 3 }]), { level: 1, change: "more" });
  assert.deepEqual(nextSupport(3, [{ help: 0 }, { help: 0 }, { help: 0 }]), { level: 3, change: null });
  assert.deepEqual(nextSupport(0, [{ help: 5 }, { help: 5 }]), { level: 0, change: null });
});

test("XP: language help is free, language barrier pays half, hints pay less", () => {
  assert.equal(answerXP({ support: "none", demand: 0, help: 9 }), 10);
  assert.equal(answerXP({ support: "none", demand: 2 }), 20);
  assert.equal(answerXP({ support: "none", demand: 0, barrier: "language" }), 5);
  assert.equal(answerXP({ support: "hint" }), 5);
  assert.equal(answerXP({ support: "explained" }), 0);
});

test("wrapping: short text and simple stem at Full and Guided; 'Say it simpler' only at Light and Open", () => {
  assert.equal(wrapping(0).text, "short"); assert.equal(wrapping(1).stem, "simple");
  assert.equal(wrapping(3).text, "long"); assert.equal(wrapping(1).simpler, false); assert.equal(wrapping(2).simpler, true);
});

test("trap counts sort most frequent first", () => {
  const t = trapCounts([at([{ traps: ["old-source", "emotive-hook"] }, { traps: ["old-source"] }])]);
  assert.deepEqual(t[0], ["old-source", 2]);
});
