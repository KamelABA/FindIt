// All settings come from backend/.env (see .env.example).

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in backend/.env (copy .env.example to .env)`);
  return value;
}

export const config = {
  port: Number(process.env.PORT) || 5000,
  supabaseUrl: required("SUPABASE_URL"),
  supabaseSecretKey: required("SUPABASE_SECRET_KEY"),
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  // Temporary admin access by email, until login / password exist (see middleware/auth.js)
  tempEmailLogin: process.env.TEMP_EMAIL_LOGIN === "true",
};
