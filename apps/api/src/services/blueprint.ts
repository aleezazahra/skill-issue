import { randomUUID } from "node:crypto";
import type {
  BlueprintContent,
  BlueprintRecord,
  IssueCandidate,
  RankedIssue,
  RepositorySummary,
  SkillProfile,
} from "@osm/shared";
import { blueprintModelSchema } from "@osm/shared";
import { github } from "../github/client";
import { AppError, toSafeError } from "../lib/errors";
import { parseModelJson } from "../lib/json";
import { aiProvider } from "../providers";
import { buildBlueprintPrompt, BLUEPRINT_SYSTEM_PROMPT } from "./prompts";

const SOURCE_EXTENSIONS =
  /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|kt|rb|php|cs|cpp|c|h|swift|vue|svelte|md|mdx|json|toml|yaml|yml)$/i;

function selectVerifiedPaths(paths: string[], title: string): string[] {
  const tokens = title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 3)
    .slice(0, 6);

  return paths
    .filter((path) => !/(^|\/)(node_modules|vendor|dist|build|\.git)\//.test(path))
    .filter((path) => SOURCE_EXTENSIONS.test(path))
    .sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const aRelevant = tokens.filter((token) => aLower.includes(token)).length;
      const bRelevant = tokens.filter((token) => bLower.includes(token)).length;
      if (aRelevant !== bRelevant) return bRelevant - aRelevant;
      return a.split("/").length - b.split("/").length || a.localeCompare(b);
    })
    .slice(0, 80);
}

async function verifiedPathsForIssue(issue: IssueCandidate): Promise<string[]> {
  try {
    const repo = await github.getRepo(issue.repository);
    const tree = await github.getTree(issue.repository, repo.default_branch);
    const paths = (tree?.tree ?? []).filter((entry) => entry.type === "blob").map((entry) => entry.path);
    return selectVerifiedPaths(paths, issue.title);
  } catch {
    return [];
  }
}

function deterministicBlueprint(
  issue: RankedIssue,
  body: string,
  verifiedPaths: string[],
): BlueprintContent {
  const samplePath = verifiedPaths[0];
  return {
    summary:
      body.trim().length > 0
        ? `${issue.title} in ${issue.repository}. ${body.replace(/\s+/g, " ").slice(0, 500)}`
        : `${issue.title} in ${issue.repository}. The issue has little written detail, so begin by asking maintainers for expected behavior.`,
    whyThisMatches: issue.reasons.length
      ? issue.reasons
      : ["The issue was selected by the deterministic ranking engine, but the match needs verification."],
    unknowns: [
      ...issue.unknowns,
      "No source files were read in depth; the implementation location is still unknown.",
      "Maintainer expectations for the pull request have not been confirmed.",
    ].slice(0, 6),
    investigationSteps: [
      {
        title: "Read the issue and repository guidance",
        description:
          "Read the full issue thread and any CONTRIBUTING documentation. Confirm the expected outcome before changing code.",
        verifiedPaths: verifiedPaths.filter((path) => /contributing|readme|docs?\//i.test(path)).slice(0, 3),
      },
      {
        title: "Locate the relevant code",
        description: samplePath
          ? `Start from the repository file ${samplePath} and search for symbols mentioned in the issue. Confirm the actual implementation path before editing.`
          : "Search the repository for symbols and error messages mentioned in the issue. No file paths were verified for this plan.",
        verifiedPaths: samplePath ? [samplePath] : [],
      },
      {
        title: "Reproduce the reported behavior",
        description:
          "Follow the project's local setup instructions and reproduce the issue before making changes. Record the exact commands and observed output.",
        verifiedPaths: [],
      },
    ],
    implementationSteps: [
      "Create a small, focused branch from the repository's default branch.",
      "Record the baseline behavior before editing.",
      "Make the smallest change that addresses the confirmed expected outcome.",
      "Add or update tests that would fail without the change.",
      "Re-run the focused tests and any documented lint or type-check commands.",
    ],
    validationSteps: [
      "Reproduce the original problem and confirm the fix changes the observed behavior.",
      "Run the project's test suite or the most relevant subset.",
      "Run documented linting, formatting and type-check commands.",
      "Check for regressions in adjacent behavior mentioned in the issue thread.",
    ],
    maintainerQuestions: [
      "Is the expected behavior described in the issue still current?",
      "Is there a preferred location or approach for this change?",
      "Are there tests, fixtures or documentation that should be updated alongside the code?",
    ],
    pullRequestChecklist: [
      "The pull request references the issue and explains the observed outcome.",
      "The diff is scoped to the issue and avoids unrelated refactors.",
      "Tests or a clear validation note are included.",
      "Documentation is updated when behavior or setup changes.",
      "All generated commands and file paths were manually verified.",
    ],
  };
}

export async function generateBlueprint(input: {
  analysisId: string;
  username: string;
  profile: SkillProfile;
  repositories: RepositorySummary[];
  issue: RankedIssue;
  candidate: IssueCandidate;
}): Promise<BlueprintRecord> {
  const verifiedPaths = await verifiedPathsForIssue(input.candidate);
  let content: BlueprintContent;
  let model = "deterministic";
  let generatedBy: BlueprintRecord["generatedBy"] = "deterministic";

  try {
    const result = await aiProvider.generate({
      system: BLUEPRINT_SYSTEM_PROMPT,
      user: buildBlueprintPrompt({
        username: input.username,
        skills: input.profile.skills,
        evidence: input.profile.evidence,
        repositories: input.repositories,
        issue: input.issue,
        issueBody: input.candidate.body,
        verifiedPaths,
      }),
      temperature: 0.25,
      maxTokens: 2200,
    });

    const parsed = blueprintModelSchema.parse(parseModelJson(result.text));
    const verifiedSet = new Set(verifiedPaths);
    content = {
      summary: parsed.summary,
      whyThisMatches: parsed.why_this_matches,
      unknowns: parsed.unknowns,
      investigationSteps: parsed.investigation_steps.map((step) => ({
        title: step.title,
        description: step.description,
        verifiedPaths: step.verified_paths.filter((path) => verifiedSet.has(path)),
      })),
      implementationSteps: parsed.implementation_steps,
      validationSteps: parsed.validation_steps,
      maintainerQuestions: parsed.maintainer_questions,
      pullRequestChecklist: parsed.pull_request_checklist,
    };
    model = result.model;
    generatedBy = "gemma";
  } catch (error) {
    const safe = toSafeError(error);
    console.warn(`[blueprint] falling back to deterministic plan: ${safe.code}`);
    content = deterministicBlueprint(input.issue, input.candidate.body, verifiedPaths);
  }

  const record: BlueprintRecord = {
    id: randomUUID(),
    analysisId: input.analysisId,
    issueId: input.issue.issueId,
    issueUrl: input.issue.url,
    issueTitle: input.issue.title,
    repository: input.issue.repository,
    content,
    model,
    generatedBy,
    createdAt: new Date().toISOString(),
  };

  return record;
}

export function assertBlueprintIssue(candidate: IssueCandidate | undefined): IssueCandidate {
  if (!candidate) {
    throw new AppError("issue_not_found", "That issue is not part of this analysis.", 404);
  }
  return candidate;
}
