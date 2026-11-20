import { HttpError } from "../lib/http.js";

export function notFound(req, _res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// Database errors that come from bad input, answered as 400 instead of 500
const INPUT_ERRORS = {
  "23503": "Unknown reference (for example a category that does not exist)",
  "23514": "Invalid value",
  "22P02": "Invalid value",
  "22007": "Invalid date",
  "22008": "Invalid date",
};

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json(err.code ? { error: err.message, code: err.code } : { error: err.message });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON body" });
  }
  if (INPUT_ERRORS[err.code]) {
    return res.status(400).json({ error: INPUT_ERRORS[err.code] });
  }
  // Database or unexpected error: log the details, answer a generic message
  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}
