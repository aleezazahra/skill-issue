import { randomUUID } from "node:crypto";
import type { AnalysisRecord, AnalysisStage } from "@osm/shared";
import { config } from "../config";
import { analysisStore } from "../db/memory";
import { github } from "../github/client";
import { toSafeError } from "../lib/errors";
import { discoverAndRankIssues } from "../matching/discovery";
import { buildEvidence } from "../services/evidence";
import { generateSkillProfile } from "../services/skills";

function now() {
  return new Date().toISOString();
}

function setStage(id: string, stage: AnalysisStage) {
  analysisStore.update(id, { status: "running", stage });
}

export function startAnalysis(username: string): AnalysisRecord {
  const active = analysisStore.findActive(username);
  if (active) return active.record;

  const timestamp = now();
  const record: AnalysisRecord = {
    id: randomUUID(),
    username,
    status: "queued",
    stage: "fetching-profile",
    repositoriesAnalyzed: 0,
    repositories: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  analysisStore.create(record);

  void runAnalysis(record.id).catch((error) => {
    const safe = toSafeError(error);
    console.warn(`[analysis] ${record.id} failed: ${safe.code}`);
    analysisStore.update(record.id, {
      status: "failed",
      errorCode: safe.code,
      errorMessage: safe.message,
    });
  });

  return record;
}

async function runAnalysis(id: string) {
  const username = analysisStore.get(id)?.record.username ?? "";

  setStage(id, "fetching-profile");
  await github.getUser(username);

  setStage(id, "inspecting-repositories");
  await github.getRepositories(username);

  setStage(id, "building-evidence");
  const bundle = await buildEvidence(username, config.limits.maxRepositories);

  analysisStore.update(id, {
    repositoriesAnalyzed: bundle.repositories.length,
    repositories: bundle.repositories,
  });

  setStage(id, "generating-skills");

  const profile = await generateSkillProfile(bundle);
  analysisStore.setProfile(id, profile);

  setStage(id, "discovering-issues");
  setStage(id, "ranking-opportunities");

  const discovery = await discoverAndRankIssues(profile.skills, bundle.repositories);
  const candidates = new Map(discovery.candidates.map((candidate) => [candidate.id, candidate]));
  analysisStore.setIssues(id, discovery.ranked, candidates, discovery.queries);

  analysisStore.update(id, {
    status: "completed",
    stage: "completed",
    repositoriesAnalyzed: bundle.repositories.length,
  });
}
