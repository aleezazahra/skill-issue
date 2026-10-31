import type { IssueCandidate, RepositorySummary, SkillAssessment } from "@osm/shared";
import { config } from "../config";
import { github } from "../github/client";
import type { GitHubIssueItem } from "../github/types";
import { rankIssues } from "./ranking";

function repositoryFromUrl(url: string): string {
  const parts = url.split("/repos/")[1];
  return parts ?? "unknown/unknown";
}

function normalizeLabels(labels: GitHubIssueItem["labels"]): string[] {
  return labels
    .map((label) => (typeof label === "string" ? label : label.name ?? ""))
    .filter(Boolean);
}

function toCandidate(item: GitHubIssueItem, language: string | null): IssueCandidate {
  const repository = repositoryFromUrl(item.repository_url);
  return {
    id: `${repository.replace("/", "-")}-${item.number}`,
    number: item.number,
    repository,
    title: item.title,
    body: item.body ?? "",
    url: item.html_url,
    labels: normalizeLabels(item.labels),
    language,
    comments: item.comments,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    repoPushedAt: null,
    repoStars: 0,
    isPullRequest: Boolean(item.pull_request),
  };
}

function chooseLanguages(
  repositories: RepositorySummary[],
  skills: SkillAssessment[],
): string[] {
  const counts = new Map<string, number>();
  const add = (language: string, weight: number) => {
    counts.set(language, (counts.get(language) ?? 0) + weight);
  };

  for (const repo of repositories) {
    repo.languages.forEach((language, index) => {
      add(language, index === 0 ? 4 : index === 1 ? 3 : index === 2 ? 2 : 1);
    });
  }

  for (const skill of skills) {
    if (/^(typescript|javascript|python|rust|go|java|kotlin|ruby|php|c#|c\+\+|swift)$/i.test(skill.name)) {
      add(skill.name, skill.confidence * 3);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([language]) => language)
    .filter((language) => !/^(html|css|shell|jupyter notebook|dockerfile)$/i.test(language))
    .slice(0, 2);
}

export interface DiscoveryResult {
  candidates: IssueCandidate[];
  ranked: ReturnType<typeof rankIssues>;
  queries: string[];
}

export async function discoverAndRankIssues(
  skills: SkillAssessment[],
  repositories: RepositorySummary[],
): Promise<DiscoveryResult> {
  const languages = chooseLanguages(repositories, skills);
  const queries: string[] = [];

  if (languages[0]) {
    queries.push(`is:issue is:open no:assignee label:"good first issue" language:"${languages[0]}"`);
  }
  if (languages[1]) {
    queries.push(`is:issue is:open no:assignee language:"${languages[1]}"`);
  } else if (languages[0]) {
    queries.push(`is:issue is:open no:assignee language:"${languages[0]}"`);
  }
  if (queries.length === 0) {
    queries.push('is:issue is:open no:assignee label:"good first issue"');
  }

  const perPage = Math.max(8, Math.ceil(config.limits.maxIssueResults / queries.length));
  const seen = new Set<string>();
  const candidates: IssueCandidate[] = [];

  for (const [index, query] of queries.entries()) {
    try {
      const result = await github.searchIssues(query, perPage);
      const language = languages[index] ?? languages[0] ?? null;
      for (const item of result.items) {
        if (item.pull_request || item.state !== "open") continue;
        const candidate = toCandidate(item, language);
        if (seen.has(candidate.id)) continue;
        if (candidate.body.trim().length === 0 && candidate.labels.length === 0) continue;
        seen.add(candidate.id);
        candidates.push(candidate);
      }
    } catch (error) {
      console.warn(`[issues] query failed for "${query}"`);
    }
  }

  return {
    candidates,
    ranked: rankIssues(candidates, skills, repositories, config.limits.maxIssueResults),
    queries,
  };
}
