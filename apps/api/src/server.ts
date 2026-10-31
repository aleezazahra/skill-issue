import cors from "cors";
import express from "express";
import { config } from "./config";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { analysesRouter } from "./routes/analyses";
import { blueprintsRouter } from "./routes/blueprints";
import { healthRouter } from "./routes/health";

const app = express();

app.disable("x-powered-by");
app.use(
  cors({
    origin: config.webOrigin === "*" ? true : config.webOrigin.split(",").map((origin) => origin.trim()),
  }),
);
app.use(express.json({ limit: "32kb" }));

app.use("/api/health", healthRouter);
app.use("/api/analyses", analysesRouter);
app.use("/api/blueprints", blueprintsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`[api] listening on http://localhost:${config.port}`);
  console.log(`[api] ai provider: ${config.aiProvider}`);
});

function shutdown(signal: string) {
  console.log(`[api] ${signal} received, shutting down`);
  server.close(() => process.exit(0));
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
