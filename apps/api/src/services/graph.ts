import type {
  AnalysisGraph,
  GraphEdge,
  GraphEdgeKind,
  GraphNode,
} from "@osm/shared";
import type { StoredAnalysis } from "../db/memory";

const DEVELOPER_ID = "developer";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function repositoryId(fullName: string): string {
  return `repo:${fullName.toLowerCase()}`;
}

function skillId(name: string): string {
  return `skill:${name.trim().toLowerCase()}`;
}

function issueId(id: string): string {
  return `issue:${id}`;
}

export function buildAnalysisGraph(entry: StoredAnalysis): AnalysisGraph {
  const { record, profile, ranked } = entry;
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();

  const addEdge = (
    source: string,
    target: string,
    kind: GraphEdgeKind,
    weight: number,
    label?: string,
  ) => {
    if (source === target) return;
    const id = `${source}|${target}|${kind}`;
    const existing = edges.get(id);
    if (existing) {
      existing.weight = clamp(existing.weight + weight, 0.2, 3);
      return;
    }
    edges.set(id, { id, source, target, kind, weight: clamp(weight, 0.2, 3), label });
  };

  nodes.set(DEVELOPER_ID, {
    id: DEVELOPER_ID,
    kind: "developer",
    label: `@${record.username}`,
    sublabel: `${record.repositoriesAnalyzed} repositories`,
    weight: clamp(record.repositoriesAnalyzed, 2, 12),
    meta: {
      repositories: record.repositoriesAnalyzed,
      skills: profile?.skills.length ?? 0,
      issues: ranked?.length ?? 0,
    },
  });

  for (const repo of record.repositories) {
    const id = repositoryId(repo.fullName);
    nodes.set(id, {
      id,
      kind: "repository",
      label: repo.name,
      sublabel: repo.languages[0] ?? repo.fullName,
      weight: clamp(1.4 + Math.log10(repo.stars + 1), 1.4, 6),
      url: repo.url,
      meta: {
        stars: repo.stars,
        forks: repo.forks,
        languages: repo.languages.join(", ") || "unknown",
      },
    });
    addEdge(DEVELOPER_ID, id, "contributes-to", 1);
  }

  if (profile) {
    for (const skill of profile.skills) {
      const id = skillId(skill.name);
      const supporting = skill.evidenceIds.filter((evidenceId) =>
        profile.evidence.some((item) => item.id === evidenceId),
      ).length;
      nodes.set(id, {
        id,
        kind: "skill",
        label: skill.name,
        sublabel: skill.assessment,
        weight: clamp(1.4 + skill.confidence * 3 + supporting * 0.15, 1.4, 6),
        meta: {
          confidence: Math.round(skill.confidence * 100),
          assessment: skill.assessment,
          evidence: supporting,
        },
      });

      for (const evidenceId of skill.evidenceIds) {
        const evidence = profile.evidence.find((item) => item.id === evidenceId);
        if (!evidence) continue;
        const repoNode = repositoryId(evidence.repository);
        if (!nodes.has(repoNode)) continue;
        addEdge(repoNode, id, "evidence", 0.9, evidence.source);
      }
    }
  }

  for (const issue of ranked ?? []) {
    const id = issueId(issue.issueId);
    nodes.set(id, {
      id,
      kind: "issue",
      label: `#${issue.number} ${issue.title}`,
      sublabel: issue.repository,
      weight: clamp(1 + issue.score / 24, 1, 7),
      url: issue.url,
      meta: {
        score: Math.round(issue.score),
        repository: issue.repository,
        difficulty: issue.difficulty.level,
        language: issue.language ?? "unknown",
      },
    });

    const repoNode = repositoryId(issue.repository);
    if (nodes.has(repoNode)) {
      addEdge(repoNode, id, "targets", 1);
    }

    for (const skillName of issue.matchedSkills) {
      const id2 = skillId(skillName);
      if (!nodes.has(id2)) continue;
      addEdge(id2, id, "matches", clamp(issue.score / 100, 0.3, 1.2));
    }
  }

  const nodeList = [...nodes.values()];
  const edgeList = [...edges.values()].filter(
    (edge) => nodes.has(edge.source) && nodes.has(edge.target),
  );

  return {
    analysisId: record.id,
    username: record.username,
    generatedAt: new Date().toISOString(),
    nodes: nodeList,
    edges: edgeList,
    stats: {
      repositories: record.repositories.length,
      skills: profile?.skills.length ?? 0,
      issues: ranked?.length ?? 0,
      evidence: profile?.evidence.length ?? 0,
      edges: edgeList.length,
    },
  };
}
