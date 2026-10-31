import { Router } from "express";
import { analysisStore } from "../db/memory";
import { AppError } from "../lib/errors";

export const blueprintsRouter = Router();

blueprintsRouter.get("/:id", (req, res, next) => {
  try {
    const blueprint = analysisStore.getBlueprint((req.params.id ?? ""));
    if (!blueprint) {
      throw new AppError("blueprint_not_found", "That blueprint does not exist.", 404);
    }
    res.json(blueprint);
  } catch (error) {
    next(error);
  }
});
