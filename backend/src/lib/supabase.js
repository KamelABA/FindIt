import { createClient } from "@supabase/supabase-js";
import { config } from "../config.js";

// Server-side client with the secret key: it bypasses Row Level Security,
// so every access rule (public vs admin) is enforced by the routes of this API.
export const db = createClient(config.supabaseUrl, config.supabaseSecretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
