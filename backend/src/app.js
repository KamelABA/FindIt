import express from "express";
import cors from "cors";
import { config } from "./config.js";
import itemsRouter from "./routes/items.js";
import categoriesRouter from "./routes/categories.js";
import adminRouter from "./routes/admin/index.js";
import { notFound, errorHandler } from "./middleware/errors.js";

export const app = express();

app.disable("x-powered-by");
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/items", itemsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/admin", adminRouter);

app.use(notFound);
app.use(errorHandler);
