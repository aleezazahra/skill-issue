import type { SkillAssessment, SkillEvidence, SkillProfile } from "@osm/shared";
import { skillProfileModelSchema } from "@osm/shared";
import { AppError, toSafeError } from "../lib/errors";
import { parseModelJson } from "../lib/json";
import { aiProvider } from "../providers";
import type { EvidenceBundle } from "./evidence";
import { buildSkillPrompt, SKILL_SYSTEM_PROMPT } from "./prompts";

export function deterministicSkillProfile(
  bundle: EvidenceBundle,
  notice?: string,
): SkillProfile {
  const grouped = new Map<string, SkillEvidence[]>();
  for (const item of bundle.evidence) {
    const key = item.skill.toLowerCase();
    const list = grouped.get(key) ?? [];
    list.push(item);
    grouped.set(key, list);
  }

  const skills: SkillAssessment[] = [...grouped.entries()]
    .map(([key, items]) => {
      const repositories = new Set(items.map((item) => item.repository));
      const sources = new Set(items.map((item) => item.source));
      const direct = sources.has("source-file") || sources.has("readme");
      const confidence = Math.min(
        0.92,
        0.38 + repositories.size * 0.09 + Math.min(items.length, 4) * 0.04,
      );
      const label = items[0]?.skill ?? key;
      return {
        name: label,
        confidence: Math.round(confidence * 100) / 100,
        evidenceIds: items.slice(0, 6).map((item) => item.id),
        assessment: direct ? ("demonstrated" as const) : ("observed" as const),
        explanation: direct
          ? `${label} appears in repository files or documentation across ${repositories.size} analyzed ${
              repositories.size === 1 ? "repository" : "repositories"
            }.`
          : `${label} is reported by GitHub metadata in ${repositories.size} analyzed ${
              repositories.size === 1 ? "repository" : "repositories"
            }; file-level evidence was limited.`,
      };
    })
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 12);

  return {
    username: bundle.user.login,
    repositoriesAnalyzed: bundle.repositories.length,
    skills,
    evidence: bundle.evidence,
    generatedBy: "deterministic",
    notice,
  };
}

export async function generateSkillProfile(bundle: EvidenceBundle): Promise<SkillProfile> {
  if (bundle.evidence.length === 0) {
    return deterministicSkillProfile(
      bundle,
      "No repository evidence was available, so no skills could be assessed.",
    );
  }

  try {
    const result = await aiProvider.generate({
      system: SKILL_SYSTEM_PROMPT,
      user: buildSkillPrompt({
        username: bundle.user.login,
        repositories: bundle.repositories,
        evidence: bundle.evidence,
      }),
      temperature: 0.2,
      maxTokens: 900,
    });

    const parsed = skillProfileModelSchema.parse(parseModelJson(result.text));
    const knownIds = new Set(bundle.evidence.map((item) => item.id));

    const skills: SkillAssessment[] = [];
    for (const skill of parsed.skills) {
      const evidenceIds = [...new Set(skill.evidence_ids)].filter((id) => knownIds.has(id));
      if (evidenceIds.length === 0) {
        throw new AppError(
          "ai_invalid_output",
          "The model referenced evidence that does not exist.",
          502,
        );
      }
      if (evidenceIds.length !== new Set(skill.evidence_ids).size) {
        throw new AppError(
          "ai_invalid_output",
          "The model referenced evidence that does not exist.",
          502,
        );
      }
      skills.push({
        name: skill.name,
        confidence: Math.round(skill.confidence * 100) / 100,
        evidenceIds,
        assessment: skill.assessment,
        explanation: skill.explanation,
      });
    }

    if (skills.length === 0) {
      throw new AppError("ai_invalid_output", "The model returned no usable skills.", 502);
    }

    return {
      username: bundle.user.login,
      repositoriesAnalyzed: bundle.repositories.length,
      skills,
      evidence: bundle.evidence,
      generatedBy: "gemma",
      model: result.model,
    };
  } catch (error) {
    const safe = toSafeError(error);
    console.warn(`[skills] falling back to deterministic profile: ${safe.code}`);
    return deterministicSkillProfile(
      bundle,
      "The AI provider was unavailable or returned invalid data, so this profile was built with deterministic evidence extraction.",
    );
  }
}
