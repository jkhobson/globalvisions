// Real sign-in (only used when js/config.js has Supabase settings). Students sign in with their school Google
// account, then join their class with the code the teacher gives them. Demo mode never loads this file's client.
import { SUPABASE_URL, SUPABASE_KEY, SCHOOL_DOMAINS } from "./config.js";
import { isSchoolEmail, cleanClassCode, cleanNick } from "./school.js";

let client;
async function sb() {
  if (!client) {
    const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm");
    client = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return client;
}

// Opens Google's sign-in page. "hd" asks Google to show school accounts first; it is only a hint,
// so the email is checked again here and by the database.
export async function signInWithGoogle() {
  const c = await sb();
  const back = location.origin + location.pathname;
  return c.auth.signInWithOAuth({ provider: "google", options: { redirectTo: back, queryParams: { hd: SCHOOL_DOMAINS[0], prompt: "select_account" } } });
}

// Returns { email, ok } for the signed-in account, or null. ok = false means it isn't a school account.
export async function account() {
  const c = await sb();
  const { data } = await c.auth.getSession();
  const email = data && data.session && data.session.user.email;
  return email ? { email, ok: isSchoolEmail(email, SCHOOL_DOMAINS) } : null;
}

export async function signOut() { const c = await sb(); await c.auth.signOut(); }

// This student's class membership (nickname, avatar, class name), or null if they haven't joined a class yet.
export async function membership() {
  const c = await sb();
  const { data, error } = await c.from("students").select("nick, avatar, classes(name)").maybeSingle();
  if (error) throw error;
  return data;
}

// Joins a class with the teacher's code. The database checks the code and the school email.
export async function joinClass(code, nick, avatar) {
  code = cleanClassCode(code); nick = cleanNick(nick);
  if (!code) return { error: "A class code has 6 letters or numbers." };
  if (!nick) return { error: "Choose a nickname with at least 2 letters." };
  const c = await sb();
  const { error } = await c.rpc("join_class", { class_code: code, nickname: nick, agent: avatar });
  if (!error) return { ok: true };
  if (/code/i.test(error.message)) return { error: "That class code didn't work. Check it with your teacher." };
  if (/nick/i.test(error.message)) return { error: "Someone in your class already has that nickname. Try another." };
  if (/school/i.test(error.message)) return { error: "Please sign in with your school account." };
  return { error: "Something went wrong. Please try again." };
}

// True if the signed-in account is listed as a teacher in the database.
export async function isTeacher() {
  const c = await sb();
  const { data, error } = await c.rpc("am_i_teacher");
  return !error && data === true;
}

// Teacher: their classes with codes and the nicknames that have joined.
export async function teacherClasses() {
  const c = await sb();
  const { data, error } = await c.from("classes").select("id, name, code, settings, students(nick, avatar, joined_at)").order("created_at");
  if (error) throw error;
  return data || [];
}

// Teacher: makes a class with a new random 6-character code (no 0/O or 1/I, so it's easy to read aloud).
export async function createClass(name) {
  const c = await sb(), { data } = await c.auth.getUser();
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let t = 0; t < 5; t++) {
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    const code = Array.from(bytes, b => abc[b % abc.length]).join("");
    const { error } = await c.from("classes").insert({ name: String(name).trim().slice(0, 30), code, teacher_id: data.user.id });
    if (!error) return { code };
    if (!/duplicate|unique/i.test(error.message)) return { error: error.message };
  }
  return { error: "Couldn't make a unique code. Try again." };
}

/* ---------------- answer checks: the server holds the answer key ---------------- */
// The order to show a question's options in (positions in the public list); the server decides where the right one goes.
export async function dealOptions(item) {
  const c = await sb(); const { data, error } = await c.rpc("deal_options", { p_item: item });
  if (error) throw error; return data;
}
// One tap: { right, explain } or { right: false, why, trap, b } or { locked: true }.
export async function checkAnswer(item, pick, ms, simplified) {
  const c = await sb(); const { data, error } = await c.rpc("check_answer", { p_item: item, p_pick: pick, p_ms: Math.round(ms || 0), p_simplified: !!simplified });
  if (error) throw error; return data;
}
export async function dealCards() {
  const c = await sb(); const { data, error } = await c.rpc("deal_cards");
  if (error) throw error; return data;
}
// One game card: { right, why }. v is null when the timer ran out.
export async function checkCard(idx, v) {
  const c = await sb(); const { data, error } = await c.rpc("check_card", { p_idx: idx, p_v: v });
  if (error) throw error; return data;
}

/* ---------------- saved work ---------------- */
// Uploads one finished activity; the server returns the XP it worked out.
export async function saveAttempt(clientId, textId, answers) {
  const c = await sb();
  const slim = answers.map(a => a.reflection ? { item: a.item, reflection: true, text: a.text }
    : a.game ? { item: a.item } : { item: a.item, help: a.help || 0 });     // what was tapped is already on the server
  const { data, error } = await c.rpc("save_attempt", { p_client_id: clientId, p_text_id: textId, p_answers: slim });
  if (error) throw error;
  return data;
}
// This student's saved work, oldest first.
export async function myAttempts() {
  const c = await sb();
  const { data, error } = await c.from("attempts").select("client_id, text_id, mode, answers, xp, created_at").order("created_at");
  if (error) throw error;
  return data || [];
}
// Leaderboards for the student's own class (nicknames only).
export async function classBoard() {
  const c = await sb();
  const { data, error } = await c.rpc("class_board");
  if (error) throw error;
  return data || [];
}
// The student's class settings (open islands, leaderboards on or off).
export async function myClassSettings() {
  const c = await sb();
  const { data } = await c.from("classes").select("settings").maybeSingle();
  return data && data.settings;
}
export async function setSupport(level) { const c = await sb(); await c.rpc("set_support", { p_level: level }); }

/* ---------------- teacher ---------------- */
export async function classAttempts(classId) {
  const c = await sb();
  const { data, error } = await c.from("attempts").select("user_id, text_id, answers, xp, created_at").eq("class_id", classId).order("created_at");
  if (error) throw error;
  return data || [];
}
export async function classStudents(classId) {
  const c = await sb();
  const { data, error } = await c.from("students").select("user_id, nick, avatar, support").eq("class_id", classId);
  if (error) throw error;
  return data || [];
}
export async function saveClassSettings(classId, settings) {
  const c = await sb();
  const { error } = await c.from("classes").update({ settings }).eq("id", classId);
  if (error) throw error;
}
