import type {
  DifficultyEstimate,
  IssueCandidate,
  RankedIssue,
  RepositorySummary,
  ScoreComponents,
  SkillAssessment,
} from "@osm/shared";
import { clamp, daysSince } from "../lib/json";
import { LANGUAGE_ALIASES } from "../services/skills-dictionary";

const WEIGHTS = {
  skillFit: 0.35,
  issueClarity: 0.25,
  scopeFit: 0.2,
  activitySignal: 0.1,
  ecosystemFit: 0.1,
} as const;

function includesSkill(haystack: string, skill: string): boolean {
  const escaped = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, "i").test(haystack);
}

function relatedLanguage(issueLanguage: string | null, languages: string[]): boolean {
  if (!issueLanguage) return false;
  const issue = issueLanguage.toLowerCase();
  for (const language of languages) {
    const aliases = LANGUAGE_ALIASES[language] ?? [language.toLowerCase()];
    if (aliases.some((alias) => alias === issue)) return true;
  }
  if (issue === "typescript" && languages.includes("JavaScript")) return true;
  if (issue === "javascript" && languages.includes("TypeScript")) return true;
  return false;
}

function skillFit(
  issue: IssueCandidate,
  skills: SkillAssessment[],
  languages: string[],
): { score: number; matched: string[] } {
  const haystack = `${issue.title}\n${issue.body}\n${issue.labels.join(" ")}\n${issue.repository}`;
  const matched: string[] = [];
  let weight = 0;

  for (const skill of skills) {
    if (includesSkill(haystack, skill.name)) {
      matched.push(skill.name);
      weight += skill.confidence;
    }
  }

  if (matched.length === 0 && relatedLanguage(issue.language, languages)) {
    return { score: 48, matched: [] };
  }

  return {
    score: clamp(18 + weight * 62),
    matched: matched.slice(0, 5),
  };
}

function issueClarity(issue: IssueCandidate): number {
  const body = issue.body.trim();
  if (body.length === 0) return 18;

  let score =
    body.length < 120 ? 34 : body.length < 300 ? 52 : body.length < 700 ? 70 : body.length < 1600 ? 82 : 86;

  if (/(steps? to reproduce|expected (behavior|result)|actual (behavior|result)|acceptance criteria|definition of done)/i.test(body)) {
    score += 8;
  }
  if (/(```|^\s*[-*]\s|^#{2,4}\s)/m.test(body)) score += 4;
  if (issue.labels.some((label) => /bug|documentation|good first issue/i.test(label))) score += 2;

  return clamp(score, 15, 96);
}

function scopeFit(issue: IssueCandidate): { score: number; difficulty: DifficultyEstimate } {
  const labels = issue.labels.map((label) => label.toLowerCase());
  const body = issue.body;
  let score = 58;
  let level: DifficultyEstimate["level"] = "unknown";
  let confidence = 0.4;
  let note = "Scope cannot be measured reliably without maintainer input.";

  if (labels.some((label) => /good first issue|beginner|starter/.test(label))) {
    score += 20;
    level = "small";
    confidence = 0.55;
    note = "The 'good first issue' label suggests a smaller entry point, but it is not a guarantee.";
  }
  if (labels.some((label) => /help wanted/.test(label))) score += 10;
  if (labels.some((label) => /documentation|docs|typo/.test(label))) {
    score += 10;
    if (level === "unknown") {
      level = "small";
      confidence = 0.5;
      note = "Documentation-oriented issue; likely bounded, but verify the expected depth.";
    }
  }
  if (labels.some((label) => /bug|fix/.test(label))) {
    score += 4;
    if (level === "unknown") {
      level = "medium";
      confidence = 0.35;
      note = "Bug fixes vary widely; reproduce first before estimating effort.";
    }
  }
  if (labels.some((label) => /epic|meta|rfc|refactor|migration|breaking|design/.test(label))) {
    score -= 22;
    level = "large";
    confidence = 0.45;
    note = "Broad or design-heavy labels suggest a larger, less bounded effort.";
  }
  if (body.length > 2500) score -= 12;
  else if (body.length > 0 && body.length < 500) score += 4;

  return {
    score: clamp(score, 15, 95),
    difficulty: { level, confidence, note },
  };
}

function activitySignal(issue: IssueCandidate): { score: number; unknown: boolean } {
  const days = daysSince(issue.repoPushedAt ?? issue.updatedAt);
  if (days === null) return { score: 45, unknown: true };
  let score =
    days <= 14 ? 92 : days <= 45 ? 82 : days <= 120 ? 68 : days <= 240 ? 52 : days <= 400 ? 38 : 25;
  if (issue.comments >= 5) score += 5;
  return { score: clamp(score, 15, 98), unknown: false };
}

function ecosystemFit(issue: IssueCandidate, languages: string[], skills: SkillAssessment[]): number {
  if (relatedLanguage(issue.language, languages)) {
    const languageSkill = skills.find(
      (skill) => skill.name.toLowerCase() === issue.language?.toLowerCase(),
    );
    return clamp(languageSkill ? 92 : 78);
  }
  const haystack = `${issue.repository} ${issue.title} ${issue.body.slice(0, 500)}`;
  if (skills.some((skill) => includesSkill(haystack, skill.name))) return 65;
  if (issue.language) return 42;
  return 50;
}

export function rankIssues(
  candidates: IssueCandidate[],
  skills: SkillAssessment[],
  repositories: RepositorySummary[],
  maxResults: number,
): RankedIssue[] {
  const languages = [...new Set(repositories.flatMap((repo) => repo.languages))];

  const ranked = candidates
    .filter((issue) => !issue.isPullRequest)
    .map((issue) => {
      const fit = skillFit(issue, skills, languages);
      const clarity = issueClarity(issue);
      const scope = scopeFit(issue);
      const activity = activitySignal(issue);
      const ecosystem = ecosystemFit(issue, languages, skills);

      const components: ScoreComponents = {
        skillFit: fit.score,
        issueClarity: clarity,
        scopeFit: scope.score,
        activitySignal: activity.score,
        ecosystemFit: ecosystem,
      };

      const total = clamp(
        components.skillFit * WEIGHTS.skillFit +
          components.issueClarity * WEIGHTS.issueClarity +
          components.scopeFit * WEIGHTS.scopeFit +
          components.activitySignal * WEIGHTS.activitySignal +
          components.ecosystemFit * WEIGHTS.ecosystemFit,
      );

      const reasons: string[] = [];
      const unknowns: string[] = [];

      if (fit.matched.length > 0) {
        reasons.push(`Touches skills with evidence in your profile: ${fit.matched.slice(0, 3).join(", ")}.`);
      } else if (fit.score >= 45) {
        reasons.push("The issue uses a language or ecosystem present in your analyzed repositories.");
      } else {
        unknowns.push("No direct skill match was found in the issue text or labels.");
      }

      if (clarity >= 76) {
        reasons.push("The description provides enough detail to start investigating.");
      } else if (clarity < 45) {
        unknowns.push("The issue description is thin; scope and expected outcome need clarification.");
      }

      if (scope.difficulty.level !== "unknown") {
        reasons.push(scope.difficulty.note);
      } else {
        unknowns.push("Implementation scope was not verified; treat the effort estimate as uncertain.");
      }

      if (activity.unknown) {
        unknowns.push("Repository activity could not be determined.");
      } else if (components.activitySignal >= 70) {
        reasons.push("The issue shows recent update activity.");
      }

      if (relatedLanguage(issue.language, languages)) {
        reasons.push(`The repository's primary language (${issue.language}) matches your evidence.`);
      }

      if (!issue.body.trim()) {
        unknowns.push("The issue has no written description.");
      }

      return {
        issueId: `${issue.repository.replace("/", "-")}-${issue.number}`,
        repository: issue.repository,
        repositoryUrl: `https://github.com/${issue.repository}`,
        number: issue.number,
        title: issue.title,
        bodyExcerpt: issue.body.slice(0, 280),
        url: issue.url,
        labels: issue.labels,
        language: issue.language,
        comments: issue.comments,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
        score: total,
        components,
        reasons: reasons.slice(0, 4),
        unknowns: unknowns.slice(0, 4),
        difficulty: scope.difficulty,
        matchedSkills: fit.matched,
      } satisfies RankedIssue;
    })
    .sort((a, b) => b.score - a.score || Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, maxResults);

  return ranked;
}

export const SCORING_WEIGHTS = WEIGHTS;
