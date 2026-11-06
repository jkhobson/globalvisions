// Pure rules for school sign-in, kept separate so they can be tested without a server.

// True when the email ends in one of the school domains, or a subdomain of one (e.g. st.vinschool.edu.vn).
export function isSchoolEmail(email, domains) {
  const m = /^[^@\s]+@([^@\s]+)$/.exec(String(email || "").trim().toLowerCase());
  if (!m) return false;
  return domains.some(d => { d = d.toLowerCase(); return m[1] === d || m[1].endsWith("." + d); });
}

// Class codes are 6 letters or digits, typed in any case. Returns the clean code, or "" if it can't be one.
export function cleanClassCode(code) {
  const c = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return c.length === 6 ? c : "";
}

// Nicknames: 2 to 16 letters or digits, no spaces. Returns "" if too short.
export function cleanNick(nick) {
  const n = String(nick || "").replace(/[^\p{L}\p{N}_-]/gu, "").slice(0, 16);
  return n.length >= 2 ? n : "";
}
