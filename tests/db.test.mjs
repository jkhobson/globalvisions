// Database rules, tested end to end on a local Postgres with a stand-in for Supabase's sign-in (tests/db/mock-supabase.sql).
// Plays a teacher, students in two classes, an outside account and an anonymous visitor, and tries the obvious cheats.
// Skipped unless GV_PG is set to a psql connection string for a server where a scratch database may be made, e.g.
//   GV_PG="postgresql://postgres@localhost:5432/postgres" npm test
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const PG = process.env.GV_PG;
test("database rules: sign-in, classes, server XP, leaderboards, privacy", { skip: !PG && "set GV_PG to run" }, () => {
  const db = `gv_test_${process.pid}`, url = new URL(PG);
  const psql = (target, args) => execFileSync("psql", [target, "-v", "ON_ERROR_STOP=1", "-q", "-o", "/dev/null", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const on = new URL(PG); on.pathname = "/" + db;
  psql(url.href, ["-c", `create database ${db}`]);
  try {
    // Each file twice: the setup guide says they are safe to run again.
    for (const f of ["tests/db/mock-supabase.sql", "supabase/schema.sql", "supabase/progress.sql", "supabase/content.sql",
                     "supabase/schema.sql", "supabase/progress.sql", "supabase/content.sql"]) psql(on.href, ["-f", f]);
    let out;
    try { out = execFileSync("psql", [on.href, "-q", "-o", "/dev/null", "-f", "tests/db/scenario.sql"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); }
    catch (e) { assert.fail((e.stderr || "").split("\n").filter(l => /ERROR|FAILED/.test(l)).join("\n") || e.message); }
    assert.match(out, /ALL DATABASE CHECKS PASSED/);
  } finally { psql(url.href, ["-c", `drop database if exists ${db} with (force)`]); }
});
