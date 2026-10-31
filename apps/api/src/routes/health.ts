import { Router } from "express";
import type { HealthResponse } from "@osm/shared";
import { config } from "../config";
import { asyncHandler } from "../lib/asyncHandler";
import { aiProvider } from "../providers";

export const healthRouter = Router();

let cachedHealth: { at: number; value: HealthResponse } | null = null;

healthRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    if (cachedHealth && Date.now() - cachedHealth.at < 10_000) {
      res.json(cachedHealth.value);
      return;
    }

    const aiHealth = await aiProvider.health();
    const value: HealthResponse = {
      status: aiHealth.ok ? "ok" : "degraded",
      uptimeSeconds: Math.round(process.uptime()),
      services: {
        github: { configured: Boolean(config.github.token) },
        ai: {
          provider: aiProvider.name,
          model: aiProvider.model,
          reachable: aiHealth.ok,
          ...(aiHealth.detail ? { error: aiHealth.detail } : {}),
        },
      },
    };
    cachedHealth = { at: Date.now(), value };
    res.json(value);
  }),
);
