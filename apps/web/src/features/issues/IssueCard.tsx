import type { RankedIssue } from "@osm/shared";
import { ArrowUpRight, Check, CircleHelp, ExternalLink } from "lucide-react";
import { componentLabels, ScoreBar } from "../../components/ScoreBar";
import { cn } from "../../lib/cn";
import { relativeTime } from "../../lib/format";

const difficultyLabel: Record<RankedIssue["difficulty"]["level"], string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  unknown: "Unknown scope",
};

export function IssueCard({ issue }: { issue: RankedIssue }) {
  const tone = issue.score >= 75 ? "text-green" : issue.score >= 55 ? "text-ink" : "text-secondary";

  return (
    <article className="surface overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-[1fr_300px]">
        <div className="panel-pad">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-muted">
            <a
              href={issue.repositoryUrl}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-ink"
            >
              {issue.repository}
            </a>
            <span aria-hidden="true">/</span>
            <span>#{issue.number}</span>
            <span aria-hidden="true">·</span>
            <span>updated {relativeTime(issue.updatedAt)}</span>
            {issue.language && (
              <>
                <span aria-hidden="true">·</span>
                <span>{issue.language}</span>
              </>
            )}
          </div>

          <h3 className="mt-2 max-w-[34ch] text-xl leading-snug">
            <a
              href={issue.url}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-green"
            >
              {issue.title}
            </a>
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {issue.labels.slice(0, 6).map((label) => (
              <span key={label} className="chip">
                {label}
              </span>
            ))}
            <span className="chip">{difficultyLabel[issue.difficulty.level]}</span>
          </div>

          {issue.bodyExcerpt && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-secondary">
              {issue.bodyExcerpt}
            </p>
          )}

          <div className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {Object.entries(issue.components).map(([key, value]) => (
              <ScoreBar key={key} label={componentLabels[key] ?? key} value={value} />
            ))}
          </div>
        </div>

        <aside className="border-t border-line bg-canvas/40 p-5 lg:border-l lg:border-t-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="data-label">Match score</p>
              <p className={cn("mt-1 text-4xl font-light tabular-nums", tone)}>{issue.score}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                Deterministic
              </p>
            </div>
            <a
              href={issue.url}
              target="_blank"
              rel="noreferrer"
              className="icon-btn icon-btn-sm"
              aria-label={`Open issue ${issue.title} on GitHub`}
            >
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          </div>

          {issue.reasons.length > 0 && (
            <div className="mt-5 border-t border-line pt-4">
              <p className="data-label mb-2">Why this surfaced</p>
              <ul className="space-y-2">
                {issue.reasons.map((reason) => (
                  <li key={reason} className="flex items-start gap-2 text-xs leading-relaxed text-secondary">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green" aria-hidden="true" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {issue.unknowns.length > 0 && (
            <div className="mt-4 border-t border-line pt-4">
              <p className="data-label mb-2">Still unknown</p>
              <ul className="space-y-2">
                {issue.unknowns.map((unknown) => (
                  <li key={unknown} className="flex items-start gap-2 text-xs leading-relaxed text-muted">
                    <CircleHelp className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {unknown}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-4 flex items-center gap-1.5 border-t border-line pt-3 text-[11px] text-muted">
            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            Difficulty: {issue.difficulty.note}
          </p>
        </aside>
      </div>
    </article>
  );
}
