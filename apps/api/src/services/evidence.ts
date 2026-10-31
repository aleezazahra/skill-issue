import type { RepositorySummary, SkillEvidence } from "@osm/shared";
import { config } from "../config";
import { github } from "../github/client";
import type { GitHubRepo, GitHubUser } from "../github/types";
import { mapLimit } from "../lib/json";
import {
  canonicalizeSkill,
  detectDependencies,
  detectTechnologies,
  skillFromTopic,
} from "./skills-dictionary";

export interface EvidenceBundle {
  user: GitHubUser;
  repositories: RepositorySummary[];
  evidence: SkillEvidence[];
}

const MANIFEST_FILES = [
  "package.json",
  "requirements.txt",
  "pyproject.toml",
  "go.mod",
  "Cargo.toml",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "composer.json",
  "Gemfile",
  "Dockerfile",
  "docker-compose.yml",
];

function selectRepositories(repositories: GitHubRepo[], limit: number): GitHubRepo[] {
  return repositories
    .filter((repo) => !repo.fork && !repo.archived)
    .sort((a, b) => {
      const aTime = Date.parse(a.pushed_at ?? a.updated_at ?? "") || 0;
      const bTime = Date.parse(b.pushed_at ?? b.updated_at ?? "") || 0;
      const aScore = aTime + Math.min(a.stargazers_count, 500) * 86_400_000 * 2;
      const bScore = bTime + Math.min(b.stargazers_count, 500) * 86_400_000 * 2;
      return bScore - aScore;
    })
    .slice(0, limit);
}

function pickManifests(paths: string[]): string[] {
  return paths
    .filter((path) => !path.includes("node_modules/") && !path.includes("/vendor/"))
    .filter((path) => {
      const segments = path.split("/");
      if (segments.length > 2) return false;
      const filename = segments[segments.length - 1] ?? "";
      return MANIFEST_FILES.includes(filename);
    })
    .slice(0, 2);
}

interface RepoEvidence {
  summary: RepositorySummary;
  items: Omit<SkillEvidence, "id">[];
}

async function inspectRepository(repo: GitHubRepo): Promise<RepoEvidence> {
  const items: Omit<SkillEvidence, "id">[] = [];

  let languages: string[] = repo.language ? [repo.language] : [];
  try {
    const languageMap = await github.getLanguages(repo.full_name);
    languages = Object.entries(languageMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);
    if (languages.length === 0 && repo.language) languages = [repo.language];
  } catch (error) {
    console.warn(`[github] languages unavailable for ${repo.full_name}`);
  }

  let readme: string | null = null;
  try {
    readme = await github.getReadme(repo.full_name);
  } catch {
    console.warn(`[github] README unavailable for ${repo.full_name}`);
  }

  const topics = (repo.topics ?? []).slice(0, 8);
  const sourceFilesInspected: string[] = [];

  for (const language of languages) {
    const skill = canonicalizeSkill(language);
    items.push({
      skill,
      repository: repo.full_name,
      source: "language-metadata",
      detail: `GitHub reports ${language} as a language used in this repository.`,
    });
  }

  for (const topic of topics) {
    const skill = skillFromTopic(topic);
    if (skill) {
      items.push({
        skill,
        repository: repo.full_name,
        source: "repository-topic",
        detail: `The repository is tagged with "${topic}".`,
      });
    }
  }

  if (readme) {
    for (const skill of detectTechnologies(readme).slice(0, 12)) {
      items.push({
        skill: canonicalizeSkill(skill),
        repository: repo.full_name,
        source: "readme",
        detail: `${skill} is mentioned in the repository README.`,
      });
    }
  }

  if (repo.default_branch) {
    try {
      const tree = await github.getTree(repo.full_name, repo.default_branch);
      const manifests = pickManifests((tree?.tree ?? []).filter((e) => e.type === "blob").map((e) => e.path));
      for (const path of manifests) {
        const content = await github.getFile(repo.full_name, path, repo.default_branch);
        if (!content) continue;
        sourceFilesInspected.push(path);
        for (const skill of detectDependencies(content).slice(0, 8)) {
          items.push({
            skill: canonicalizeSkill(skill),
            repository: repo.full_name,
            source: "source-file",
            detail: `${skill} appears in ${path}.`,
          });
        }
      }
    } catch {
      console.warn(`[github] file tree unavailable for ${repo.full_name}`);
    }
  }

  return {
    summary: {
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      description: repo.description,
      languages,
      topics,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      pushedAt: repo.pushed_at,
      readmeInspected: Boolean(readme),
      sourceFilesInspected,
    },
    items,
  };
}

export async function buildEvidence(
  username: string,
  maxRepositories = config.limits.maxRepositories,
): Promise<EvidenceBundle> {
  const [user, repositories] = await Promise.all([
    github.getUser(username),
    github.getRepositories(username),
  ]);

  const selected = selectRepositories(repositories, maxRepositories);
  if (selected.length === 0) {
    return { user, repositories: [], evidence: [] };
  }

  const inspected = await mapLimit(
    selected,
    config.limits.maxParallelRepoFetches,
    inspectRepository,
  );

  const seen = new Set<string>();
  const deduped: Omit<SkillEvidence, "id">[] = [];
  for (const repo of inspected) {
    for (const item of repo.items) {
      const key = `${item.skill.toLowerCase()}|${item.repository.toLowerCase()}|${item.source}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
    }
  }

  deduped.sort(
    (a, b) =>
      a.skill.localeCompare(b.skill) ||
      a.repository.localeCompare(b.repository) ||
      a.source.localeCompare(b.source),
  );

  const evidence: SkillEvidence[] = deduped.map((item, index) => ({
    id: `e${index + 1}`,
    ...item,
  }));

  return {
    user,
    repositories: inspected.map((repo) => repo.summary),
    evidence,
  };
}
