import { config } from "../config.js";
import { db } from "../lib/supabase.js";
import { HttpError } from "../lib/http.js";

export const ROLES = ["student", "admin", "super_admin"];

/**
 * Admin guard: the account must have role = admin or super_admin and not be suspended.
 * Sets req.user = { id, full_name, email, role }.
 *
 * TEMPORARY identification, until login / password are added: the dashboard sends the
 * admin's email in the `X-User-Email` header. This is not secure (anyone who knows an admin
 * email gets in), so it only works when TEMP_EMAIL_LOGIN=true. When real login exists,
 * replace the email lookup below with the logged-in user's id and keep the role checks.
 *
 * Error codes (the frontend signs out on these): sign_in_required, no_account, not_admin, suspended
 */
export async function requireAdmin(req, _res, next) {
  if (!config.tempEmailLogin) {
    throw new HttpError(503, "Admin access is disabled until login is added (TEMP_EMAIL_LOGIN=false).", "login_disabled");
  }

  const email = String(req.get("x-user-email") ?? "").trim();
  if (!email) throw new HttpError(401, "Sign in required", "sign_in_required");

  const { data: user, error } = await db
    .from("users")
    .select("id, full_name, email, role, is_suspended")
    .ilike("email", email.replace(/[\\%_]/g, "\\$&")) // case-insensitive exact match
    .maybeSingle();
  if (error) throw error;
  if (!user) throw new HttpError(401, "No account with this email", "no_account");
  if (user.role !== "admin" && user.role !== "super_admin") throw new HttpError(403, "This account is not an admin", "not_admin");
  if (user.is_suspended) throw new HttpError(403, "This account is suspended", "suspended");

  req.user = { id: user.id, full_name: user.full_name, email: user.email, role: user.role };
  next();
}

/** Super admin only (use after requireAdmin): managing admins, roles and system settings. */
export function requireSuperAdmin(req, _res, next) {
  if (req.user?.role !== "super_admin") {
    throw new HttpError(403, "Only a super admin can do this", "super_admin_required");
  }
  next();
}
