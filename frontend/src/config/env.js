// Central place for environment flags (see .env.example)
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const AUTH_ENABLED = import.meta.env.VITE_AUTH_ENABLED === "true";
