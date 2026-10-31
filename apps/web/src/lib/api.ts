import type {
  AnalysisRecord,
  BlueprintRecord,
  HealthResponse,
  RankedIssue,
  SkillProfile,
} from "@osm/shared";

interface ApiErrorBody {
  error?: { code?: string; message?: string; fields?: Array<{ path: string; message: string }> };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly fields?: Array<{ path: string; message: string }>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError("The backend could not be reached.", "network_error", 0);
  }

  if (!response.ok) {
    let body: ApiErrorBody = {};
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new ApiError(
      body.error?.message ?? `Request failed with status ${response.status}.`,
      body.error?.code ?? "request_failed",
      response.status,
      body.error?.fields,
    );
  }

  return (await response.json()) as T;
}

export interface SkillsResponse {
  analysisId: string;
  status: AnalysisRecord["status"];
  profile: SkillProfile;
}

export interface IssuesResponse {
  analysisId: string;
  status: AnalysisRecord["status"];
  scoreWeights: Record<string, number>;
  queries: string[];
  issues: RankedIssue[];
}

export const api = {
  health: () => request<HealthResponse>("/api/health"),

  startAnalysis: (username: string) =>
    request<{ analysisId: string; status: string }>("/api/analyses", {
      method: "POST",
      body: JSON.stringify({ username }),
    }),

  getAnalysis: (id: string) => request<AnalysisRecord>(`/api/analyses/${id}`),

  getSkills: (id: string) => request<SkillsResponse>(`/api/analyses/${id}/skills`),

  getIssues: (id: string) => request<IssuesResponse>(`/api/analyses/${id}/issues`),

  createBlueprint: (analysisId: string, issueId: string) =>
    request<BlueprintRecord>(`/api/analyses/${analysisId}/blueprints`, {
      method: "POST",
      body: JSON.stringify({ issueId }),
    }),

  getBlueprint: (id: string) => request<BlueprintRecord>(`/api/blueprints/${id}`),
};
