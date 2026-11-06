// Supabase settings. Empty = demo mode: everything is stored in this browser only, with a made-up class.
// Fill these in only after the school approves where student data is stored (see docs/setup-school-login.md).
export const SUPABASE_URL = "";
export const SUPABASE_KEY = "";      // the publishable (anon) key only; never put a secret key here
export const DEMO = !SUPABASE_URL;

// Only Google accounts from these school domains may join. The database checks this too (supabase/schema.sql),
// so changing it here alone does not let anyone else in.
export const SCHOOL_DOMAINS = ["vinschool.edu.vn"];
