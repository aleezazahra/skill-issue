import { ArrowUpRight, Github, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/cn";
import { relativeTime } from "../../lib/format";
import {
  forgetSession,
  listRecentSessions,
  type RecentSession,
} from "../../lib/recentSessions";

const statusCopy: Record<RecentSession["status"], string> = {
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
};

export function RecentSessions() {
  const [sessions, setSessions] = useState<RecentSession[]>([]);

  useEffect(() => {
    setSessions(listRecentSessions());
  }, []);

  function remove(analysisId: string) {
    setSessions(forgetSession(analysisId));
  }

  return (
    <section aria-labelledby="recent-sessions-heading" className="border-b border-line">
      <div className="page-shell py-12 sm:py-14">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Previous sessions</p>
            <h2 id="recent-sessions-heading" className="mt-1 text-2xl">
              Pick up where you left off.
            </h2>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
            {sessions.length > 0
              ? `${sessions.length} saved in this browser`
              : "Stored locally in this browser"}
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className="mt-6 rounded-panel border border-dashed border-line px-5 py-8 text-center">
            <p className="text-sm text-secondary">
              Analyses you run will appear here, so you can return to a profile by username
              without re-running the whole pipeline.
            </p>
            <Link
              to="/analyze"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-green transition-opacity hover:opacity-80"
            >
              Run your first analysis
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="surface mt-6 overflow-hidden">
            {sessions.map((session) => (
              <div
                key={session.analysisId}
                className="flex flex-col gap-3 border-b border-line px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <Link
                  to={`/analysis/${session.analysisId}`}
                  className="group flex min-w-0 items-center gap-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-canvas text-muted transition-colors group-hover:text-green">
                    <Github size={15} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink transition-colors group-hover:text-green">
                      @{session.username}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                      <span>
                        {session.repositoriesAnalyzed}{" "}
                        {session.repositoriesAnalyzed === 1 ? "repository" : "repositories"}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={cn(
                          session.status === "failed" && "text-danger",
                          session.status === "completed" && "text-green",
                        )}
                      >
                        {statusCopy[session.status]}
                      </span>
                    </span>
                  </span>
                </Link>

                <div className="flex items-center gap-2 sm:justify-end">
                  <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                    {relativeTime(session.updatedAt)}
                  </span>
                  <Link
                    to={`/analysis/${session.analysisId}`}
                    className="icon-btn icon-btn-sm"
                    aria-label={`Open analysis for ${session.username}`}
                  >
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(session.analysisId)}
                    className="icon-btn icon-btn-sm"
                    aria-label={`Remove ${session.username} from previous sessions`}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
