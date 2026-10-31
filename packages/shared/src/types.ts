export type AnalysisStatus = "queued" | "running" | "completed" | "failed";

export type AnalysisStage =
  | "fetching-profile"
  | "inspecting-repositories"
  | "building-evidence"
  | "generating-skills"
  | "discovering-issues"
  | "ranking-opportunities"
  | "completed";

export type SkillAssessmentLabel = "observed" | "demonstrated" | "inferred";

export type EvidenceSource =
  | "language-metadata"
  | "readme"
  | "source-file"
  | "repository-topic";

export interface SkillEvidence {
  id: string;
  skill: string;
  repository: string;
  source: EvidenceSource;
  detail: string;
}

export interface SkillAssessment {
  name: string;
  confidence: number;
  evidenceIds: string[];
  assessment: SkillAssessmentLabel;
  explanation: string;
}

export interface SkillProfile {
  username: string;
  repositoriesAnalyzed: number;
  skills: SkillAssessment[];
  evidence: SkillEvidence[];
  generatedBy: "gemma" | "deterministic";
  model?: string;
  notice?: string;
}

export interface AnalysisRecord {
  id: string;
  username: string;
  status: AnalysisStatus;
  stage: AnalysisStage;
  repositoriesAnalyzed: number;
  repositories: RepositorySummary[];
  createdAt: string;
  updatedAt: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface RepositorySummary {
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  languages: string[];
  topics: string[];
  stars: number;
  forks: number;
  pushedAt: string | null;
  readmeInspected: boolean;
  sourceFilesInspected: string[];
}

export interface IssueCandidate {
  id: string;
  number: number;
  repository: string;
  title: string;
  body: string;
  url: string;
  labels: string[];
  language: string | null;
  comments: number;
  createdAt: string;
  updatedAt: string;
  repoPushedAt: string | null;
  repoStars: number;
  isPullRequest: boolean;
}

export interface ScoreComponents {
  skillFit: number;
  issueClarity: number;
  scopeFit: number;
  activitySignal: number;
  ecosystemFit: number;
}

export interface DifficultyEstimate {
  level: "small" | "medium" | "large" | "unknown";
  confidence: number;
  note: string;
}

export interface RankedIssue {
  issueId: string;
  repository: string;
  repositoryUrl: string;
  number: number;
  title: string;
  bodyExcerpt: string;
  url: string;
  labels: string[];
  language: string | null;
  comments: number;
  createdAt: string;
  updatedAt: string;
  score: number;
  components: ScoreComponents;
  reasons: string[];
  unknowns: string[];
  difficulty: DifficultyEstimate;
  matchedSkills: string[];
}

export interface InvestigationStep {
  title: string;
  description: string;
  verifiedPaths: string[];
}

export interface BlueprintContent {
  summary: string;
  whyThisMatches: string[];
  unknowns: string[];
  investigationSteps: InvestigationStep[];
  implementationSteps: string[];
  validationSteps: string[];
  maintainerQuestions: string[];
  pullRequestChecklist: string[];
}

export interface BlueprintRecord {
  id: string;
  analysisId: string;
  issueId: string;
  issueUrl: string;
  issueTitle: string;
  repository: string;
  content: BlueprintContent;
  model: string;
  generatedBy: "gemma" | "deterministic";
  createdAt: string;
}

export interface HealthResponse {
  status: "ok" | "degraded";
  uptimeSeconds: number;
  services: {
    github: { configured: boolean };
    ai: {
      provider: string;
      model: string;
      reachable: boolean | null;
      error?: string;
    };
  };
}
