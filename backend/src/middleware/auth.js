import { config } from "../config.js";
import { db } from "../lib/supabase.js";
import { HttpError } from "../lib/http.js";

/**
 * TEMPORARY admin guard, until login / password are added.
 *
 * The dashboard sends the admin's email in the `X-User-Email` header; the account must exist
 * in `users` with is_admin = true. Admin rights are managed only in the database.
 *
 * This is not secure (anyone who knows an admin email gets in), so it only works when
 * TEMP_EMAIL_LOGIN=true. When real login exists, replace the email lookup below with the
 * logged-in user's id (from the session / token) and keep the is_admin check.
 */
export async function requireAdmin(req, _res, next) {
  if (!config.tempEmailLogin) {
    throw new HttpError(503, "Admin access is disabled until login is added (TEMP_EMAIL_LOGIN=false).");
  }

  const email = String(req.get("x-user-email") ?? "").trim();
  if (!email) throw new HttpError(401, "Sign in required");

  const { data: user, error } = await db
    .from("users")
    .select("id, full_name, email, is_admin, is_suspended")
    .ilike("email", email.replace(/[\\%_]/g, "\\$&")) // case-insensitive exact match
    .maybeSingle();
  if (error) throw error;
  if (!user) throw new HttpError(401, "No account with this email");
  if (!user.is_admin) throw new HttpError(403, "This account is not an admin");
  if (user.is_suspended) throw new HttpError(403, "This account is suspended");

  req.user = user;
  next();
}
