import { useQuery } from "@tanstack/react-query";
import type { AnalysisRecord, RankedIssue, SkillProfile } from "@osm/shared";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  FileCode2,
  Github,
  Info,
  RefreshCw,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { EmptyState, ErrorNotice } from "../components/Feedback";
import { StageProgress } from "../features/analysis/StageProgress";
import { IssueCard } from "../features/issues/IssueCard";
import { SkillCard } from "../features/skills/SkillCard";
import { ApiError, api } from "../lib/api";
import { cn } from "../lib/cn";
import { compactNumber, formatDate, relativeTime } from "../lib/format";
import { rememberSession } from "../lib/recentSessions";

type Tab = "overview" | "skills" | "issues";

const statusCopy: Record<AnalysisRecord["status"], string> = {
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
};

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note?: string;
}) {
  return (
    <div className="surface panel-pad">
      <p className="data-label">{label}</p>
      <p className="mt-2 text-3xl font-light tabular-nums text-ink">{value}</p>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </div>
  );
}

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "The request could not be completed.";
}

export function AnalysisPage() {
  const { id = "" } = useParams();
  const [tab, setTab] = useState<Tab>("overview");

  const analysisQuery = useQuery<AnalysisRecord>({
    queryKey: ["analysis", id],
    queryFn: () => api.getAnalysis(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "queued" || status === "running" ? 1500 : false;
    },
  });

  const record = analysisQuery.data;
  const completed = record?.status === "completed";

  useEffect(() => {
    if (!record) return;
    if (record.status !== "completed" && record.status !== "failed") return;
    rememberSession({
      analysisId: record.id,
      username: record.username,
      repositoriesAnalyzed: record.repositoriesAnalyzed,
      status: record.status,
      updatedAt: record.updatedAt,
    });
  }, [record]);

  const skillsQuery = useQuery<{ profile: SkillProfile }>({
    queryKey: ["skills", id],
    queryFn: () => api.getSkills(id),
    enabled: completed,
  });

  const issuesQuery = useQuery<{ issues: RankedIssue[] }>({
    queryKey: ["issues", id],
    queryFn: () => api.getIssues(id),
    enabled: completed,
  });

  if (!id) {
    return (
      <div className="page-shell py-20">
        <EmptyState
          title="No analysis selected"
          message="Start with a public GitHub profile to create a new analysis."
          action={<Button to="/analyze">Start an analysis</Button>}
        />
      </div>
    );
  }

  if (analysisQuery.isPending) {
    return (
      <div className="page-shell py-12">
        <div className="skeleton h-4 w-28" />
        <div className="mt-6 skeleton h-12 w-64" />
        <div className="mt-3 skeleton h-4 w-80" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="skeleton h-28 rounded-panel" />
          ))}
        </div>
        <div className="mt-6 skeleton h-80 rounded-panel" />
      </div>
    );
  }

  if (analysisQuery.isError || !record) {
    return (
      <div className="page-shell py-16">
        <ErrorNotice
          title="Analysis unavailable"
          message={errorMessage(analysisQuery.error)}
          action={<Button to="/analyze">Start a new analysis</Button>}
        />
      </div>
    );
  }

  const profile = skillsQuery.data?.profile;
  const issues = issuesQuery.data?.issues ?? [];
  const running = record.status === "queued" || record.status === "running";

  const tabs: Array<{ key: Tab; label: string; count?: number }> = [
    { key: "overview", label: "Overview" },
    { key: "skills", label: "Skills", count: profile?.skills.length },
    { key: "issues", label: "Matched issues", count: completed ? issues.length : undefined },
  ];

  return (
    <>
      <section className="border-b border-line bg-surface/60">
        <div className="page-shell py-8 sm:py-10">
          <Link
            to="/analyze"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            New analysis
          </Link>

          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow flex items-center gap-2">
                <Github size={12} aria-hidden="true" />
                Developer analysis
              </p>
              <h1 className="mt-2 text-[clamp(2rem,4vw,3.1rem)]">@{record.username}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted">
                <span>{record.repositoriesAnalyzed} repositories analyzed</span>
                <span aria-hidden="true">·</span>
                <span>updated {relativeTime(record.updatedAt)}</span>
                <span aria-hidden="true">·</span>
                <span>{record.id.slice(0, 8)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-1.5 text-xs font-medium",
                  record.status === "failed" ? "text-danger" : "text-secondary",
                )}
              >
                <span
                  className={cn(
                    "status-dot",
                    running && "animate-pulse",
                    record.status === "completed" && "bg-green",
                    record.status === "failed" && "status-dot-danger",
                    record.status === "queued" && "status-dot-muted",
                  )}
                  aria-hidden="true"
                />
                {statusCopy[record.status]}
              </span>
              <Button
                variant="secondary"
                size="sm"
                to={`/analyze?username=${encodeURIComponent(record.username)}`}
              >
                <RefreshCw size={13} aria-hidden="true" />
                Re-run
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="page-shell py-8 sm:py-10">
        {record.status === "failed" && (
          <ErrorNotice
            className="mb-8"
            title="This analysis failed"
            message={
              record.errorMessage ??
              "The analysis stopped before results were available. Check the backend logs and try again."
            }
            action={
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  to={`/analyze?username=${encodeURIComponent(record.username)}`}
                >
                  Try again
                </Button>
                <span className="self-center font-mono text-[11px] text-muted">
                  {record.errorCode ?? "unknown_error"}
                </span>
              </div>
            }
          />
        )}

        <div role="tablist" aria-label="Analysis sections" className="flex gap-1 border-b border-line">
          {tabs.map((item) => {
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.key)}
                className={cn(
                  "relative -mb-px flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors sm:px-4",
                  active
                    ? "border-green text-ink"
                    : "border-transparent text-muted hover:text-ink",
                )}
              >
                {item.label}
                {typeof item.count === "number" && (
                  <span className="rounded-full bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-muted">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {tab === "overview" && (
          <div className="mt-7 space-y-7">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                label="Repositories"
                value={record.repositoriesAnalyzed}
                note="Non-fork, bounded selection"
              />
              <Stat
                label="Skills assessed"
                value={profile?.skills.length ?? "—"}
                note={profile?.generatedBy === "gemma" ? `Gemma · ${profile.model ?? ""}` : "Awaiting profile"}
              />
              <Stat
                label="Issues ranked"
                value={completed ? issues.length : "—"}
                note="Open, non-PR issues"
              />
              <Stat
                label="Evidence records"
                value={profile?.evidence.length ?? "—"}
                note="Every skill links to evidence"
              />
            </div>

            {running && <StageProgress status={record.status} stage={record.stage} />}

            {completed && (
              <div className="surface panel-pad flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-green/40 bg-green/10 text-green-deep">
                    <Check size={15} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">Analysis complete</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">
                      {profile?.generatedBy === "gemma"
                        ? `Skill profile generated by ${profile.model ?? "Gemma"} and validated against the evidence bundle.`
                        : "Skill profile built deterministically from GitHub evidence."}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="quiet" onClick={() => setTab("skills")}>
                    View skills
                  </Button>
                  <Button size="sm" onClick={() => setTab("issues")}>
                    View issues
                    <ArrowRight size={14} aria-hidden="true" />
                  </Button>
                </div>
              </div>
            )}

            {profile?.notice && (
              <div className="flex items-start gap-2.5 rounded-[10px] border border-line bg-surface px-4 py-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                <p className="text-xs leading-relaxed text-muted">{profile.notice}</p>
              </div>
            )}

            <div>
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <p className="eyebrow">Inspected repositories</p>
                  <h2 className="mt-1 text-xl">The evidence base</h2>
                </div>
                <span className="font-mono text-[11px] text-muted">
                  {record.repositories.length} of {record.repositoriesAnalyzed}
                </span>
              </div>

              {record.repositories.length === 0 ? (
                <EmptyState
                  title="No public repositories found"
                  message="This profile has no non-fork public repositories to inspect. Try a different GitHub username."
                  action={<Button to="/analyze">Try another profile</Button>}
                />
              ) : (
                <div className="surface overflow-hidden">
                  <div className="hidden grid-cols-[1.6fr_1fr_0.7fr_0.8fr] gap-4 border-b border-line bg-elevated/40 px-5 py-3 md:grid">
                    <span className="data-label">Repository</span>
                    <span className="data-label">Languages</span>
                    <span className="data-label">Activity</span>
                    <span className="data-label">Inspected</span>
                  </div>
                  {record.repositories.map((repo) => (
                    <div
                      key={repo.fullName}
                      className="grid gap-3 border-b border-line px-5 py-4 last:border-b-0 md:grid-cols-[1.6fr_1fr_0.7fr_0.8fr] md:items-center md:gap-4"
                    >
                      <div className="min-w-0">
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink transition-colors hover:text-green-deep"
                        >
                          {repo.name}
                          <ExternalLink size={12} aria-hidden="true" />
                        </a>
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                          {repo.description ?? "No description"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {repo.languages.slice(0, 3).map((language) => (
                          <span key={language} className="chip !px-2 !py-0.5 !text-[9px]">
                            {language}
                          </span>
                        ))}
                        {repo.languages.length === 0 && (
                          <span className="text-xs text-muted">Unknown</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 font-mono text-[11px] text-muted">
                        <span className="inline-flex items-center gap-1">
                          <Star size={11} aria-hidden="true" />
                          {compactNumber(repo.stars)}
                        </span>
                        <span>{repo.pushedAt ? relativeTime(repo.pushedAt) : "unknown"}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
                        <span className="inline-flex items-center gap-1">
                          <FileCode2 size={11} aria-hidden="true" />
                          {repo.sourceFilesInspected.length} files
                        </span>
                        {repo.readmeInspected && <span className="chip !px-2 !py-0.5 !text-[9px]">README</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-muted">
              Analysis started {formatDate(record.createdAt)}. Skills are estimates supported by
              evidence, not certifications.
            </p>
          </div>
        )}

        {tab === "skills" && (
          <div className="mt-7">
            {skillsQuery.isPending && (
              <div className="grid gap-4 md:grid-cols-2">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="skeleton h-56 rounded-panel" />
                ))}
              </div>
            )}

            {skillsQuery.isError && (
              <ErrorNotice
                title="Skill profile unavailable"
                message={errorMessage(skillsQuery.error)}
                action={
                  <Button size="sm" variant="secondary" onClick={() => skillsQuery.refetch()}>
                    Retry
                  </Button>
                }
              />
            )}

            {profile && (
              <div className="space-y-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="eyebrow">Skill profile</p>
                    <h2 className="mt-1 text-xl">Supported assessments</h2>
                  </div>
                  <p className="font-mono text-[11px] text-muted">
                    {profile.generatedBy === "gemma"
                      ? `Generated by ${profile.model ?? "Gemma"}`
                      : "Deterministic extraction"}
                  </p>
                </div>

                {profile.skills.length === 0 ? (
                  <EmptyState
                    title="No skills could be assessed"
                    message="The repositories inspected did not produce enough evidence for a skill assessment."
                  />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {profile.skills.map((skill) => (
                      <SkillCard
                        key={skill.name}
                        skill={skill}
                        evidence={profile.evidence}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "issues" && (
          <div className="mt-7">
            {issuesQuery.isPending && (
              <div className="space-y-4">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="skeleton h-64 rounded-panel" />
                ))}
              </div>
            )}

            {issuesQuery.isError && (
              <ErrorNotice
                title="Issue recommendations unavailable"
                message={errorMessage(issuesQuery.error)}
                action={
                  <Button size="sm" variant="secondary" onClick={() => issuesQuery.refetch()}>
                    Retry
                  </Button>
                }
              />
            )}

            {completed && issues.length === 0 && (
              <EmptyState
                title="No suitable issues found"
                message="GitHub returned no open, non-pull-request issues for the evidenced languages. Adding a GITHUB_TOKEN raises search limits and often improves results."
                action={<Button to="/analyze">Try another profile</Button>}
              />
            )}

            {issues.length > 0 && (
              <div className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="eyebrow">Ranked opportunities</p>
                    <h2 className="mt-1 text-xl">
                      {issues.length} issues, ranked deterministically
                    </h2>
                  </div>
                  <p className="font-mono text-[11px] text-muted">
                    Scores recalculated from live GitHub data
                  </p>
                </div>

                <div className="space-y-4">
                  {issues.map((issue) => (
                    <IssueCard key={issue.issueId} issue={issue} analysisId={record.id} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
