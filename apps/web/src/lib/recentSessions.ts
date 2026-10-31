import type { AnalysisRecord } from "@osm/shared";

export interface RecentSession {
  analysisId: string;
  username: string;
  repositoriesAnalyzed: number;
  status: AnalysisRecord["status"];
  updatedAt: string;
  savedAt: string;
}

const STORAGE_KEY = "skillissue:recent-sessions";
const LIMIT = 8;

function isSession(value: unknown): value is RecentSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<RecentSession>;
  return (
    typeof session.analysisId === "string" &&
    typeof session.username === "string" &&
    typeof session.repositoriesAnalyzed === "number" &&
    typeof session.status === "string" &&
    typeof session.updatedAt === "string" &&
    typeof session.savedAt === "string"
  );
}

export function listRecentSessions(): RecentSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isSession)
      .sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt))
      .slice(0, LIMIT);
  } catch {
    return [];
  }
}

export function rememberSession(
  session: Omit<RecentSession, "savedAt">,
): RecentSession[] {
  if (typeof window === "undefined") return [];
  const next: RecentSession[] = [
    { ...session, savedAt: new Date().toISOString() },
    ...listRecentSessions().filter((item) => item.analysisId !== session.analysisId),
  ].slice(0, LIMIT);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage may be unavailable in private mode */
  }
  return next;
}

export function forgetSession(analysisId: string): RecentSession[] {
  if (typeof window === "undefined") return [];
  const next = listRecentSessions().filter((item) => item.analysisId !== analysisId);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}
