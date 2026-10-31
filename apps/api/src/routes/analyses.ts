import { Router } from "express";
import { createAnalysisSchema, createBlueprintSchema } from "@osm/shared";
import { analysisStore } from "../db/memory";
import { startAnalysis } from "../jobs/analysisRunner";
import { asyncHandler } from "../lib/asyncHandler";
import { AppError } from "../lib/errors";
import { SCORING_WEIGHTS } from "../matching/ranking";
import { assertBlueprintIssue, generateBlueprint } from "../services/blueprint";

export const analysesRouter = Router();

analysesRouter.post("/", (req, res, next) => {
  try {
    const { username } = createAnalysisSchema.parse(req.body);
    const record = startAnalysis(username);
    res.status(202).json({ analysisId: record.id, status: record.status });
  } catch (error) {
    next(error);
  }
});

analysesRouter.get("/:id", (req, res, next) => {
  try {
    const entry = analysisStore.get((req.params.id ?? ""));
    if (!entry) {
      throw new AppError("analysis_not_found", "That analysis does not exist.", 404);
    }
    res.json(entry.record);
  } catch (error) {
    next(error);
  }
});

analysesRouter.get("/:id/skills", (req, res, next) => {
  try {
    const entry = analysisStore.get((req.params.id ?? ""));
    if (!entry) {
      throw new AppError("analysis_not_found", "That analysis does not exist.", 404);
    }
    if (!entry.profile) {
      throw new AppError(
        "skills_not_ready",
        entry.record.status === "failed"
          ? "This analysis failed before a skill profile was produced."
          : "The skill profile is still being generated.",
        409,
      );
    }
    res.json({
      analysisId: entry.record.id,
      status: entry.record.status,
      profile: entry.profile,
    });
  } catch (error) {
    next(error);
  }
});

analysesRouter.get("/:id/issues", (req, res, next) => {
  try {
    const entry = analysisStore.get((req.params.id ?? ""));
    if (!entry) {
      throw new AppError("analysis_not_found", "That analysis does not exist.", 404);
    }
    if (!entry.ranked) {
      throw new AppError(
        "issues_not_ready",
        entry.record.status === "failed"
          ? "This analysis failed before issues were ranked."
          : "Issue recommendations are still being generated.",
        409,
      );
    }
    res.json({
      analysisId: entry.record.id,
      status: entry.record.status,
      scoreWeights: SCORING_WEIGHTS,
      queries: entry.queries ?? [],
      issues: entry.ranked,
    });
  } catch (error) {
    next(error);
  }
});

analysesRouter.post(
  "/:id/blueprints",
  asyncHandler(async (req, res) => {
    const { issueId } = createBlueprintSchema.parse(req.body);
    const entry = analysisStore.get((req.params.id ?? ""));
    if (!entry) {
      throw new AppError("analysis_not_found", "That analysis does not exist.", 404);
    }
    if (!entry.profile || !entry.ranked) {
      throw new AppError("analysis_incomplete", "This analysis has no results yet.", 409);
    }

    const existing = analysisStore.findBlueprint(entry.record.id, issueId);
    if (existing) {
      res.json(existing);
      return;
    }

    const ranked = entry.ranked.find((issue) => issue.issueId === issueId);
    if (!ranked) {
      throw new AppError("issue_not_found", "That issue is not part of this analysis.", 404);
    }

    const candidate = assertBlueprintIssue(entry.candidates?.get(issueId));
    const blueprint = await generateBlueprint({
      analysisId: entry.record.id,
      username: entry.record.username,
      profile: entry.profile,
      repositories: entry.record.repositories,
      issue: ranked,
      candidate,
    });

    analysisStore.saveBlueprint(blueprint);
    res.status(201).json(blueprint);
  }),
);
