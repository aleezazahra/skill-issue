import type {
  AnalysisRecord,
  BlueprintRecord,
  IssueCandidate,
  RankedIssue,
  SkillProfile,
} from "@osm/shared";

export interface StoredAnalysis {
  record: AnalysisRecord;
  profile?: SkillProfile;
  ranked?: RankedIssue[];
  candidates?: Map<string, IssueCandidate>;
  queries?: string[];
}

const analyses = new Map<string, StoredAnalysis>();
const blueprints = new Map<string, BlueprintRecord>();
const analysisByUsername = new Map<string, string>();

export const analysisStore = {
  create(record: AnalysisRecord) {
    analyses.set(record.id, { record });
    analysisByUsername.set(record.username.toLowerCase(), record.id);
  },

  get(id: string): StoredAnalysis | undefined {
    return analyses.get(id);
  },

  findByUsername(username: string): StoredAnalysis | undefined {
    const id = analysisByUsername.get(username.toLowerCase());
    return id ? analyses.get(id) : undefined;
  },

  findActive(username: string): StoredAnalysis | undefined {
    const existing = this.findByUsername(username);
    if (!existing) return undefined;
    return existing.record.status === "queued" || existing.record.status === "running"
      ? existing
      : undefined;
  },

  update(id: string, patch: Partial<AnalysisRecord>) {
    const entry = analyses.get(id);
    if (!entry) return;
    entry.record = { ...entry.record, ...patch, updatedAt: new Date().toISOString() };
  },

  setProfile(id: string, profile: SkillProfile) {
    const entry = analyses.get(id);
    if (entry) entry.profile = profile;
  },

  setIssues(
    id: string,
    ranked: RankedIssue[],
    candidates: Map<string, IssueCandidate>,
    queries: string[],
  ) {
    const entry = analyses.get(id);
    if (!entry) return;
    entry.ranked = ranked;
    entry.candidates = candidates;
    entry.queries = queries;
  },

  saveBlueprint(blueprint: BlueprintRecord) {
    blueprints.set(blueprint.id, blueprint);
  },

  getBlueprint(id: string) {
    return blueprints.get(id);
  },

  findBlueprint(analysisId: string, issueId: string) {
    return [...blueprints.values()].find(
      (blueprint) => blueprint.analysisId === analysisId && blueprint.issueId === issueId,
    );
  },
};
