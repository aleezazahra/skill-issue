import type { AnalysisStage, AnalysisStatus } from "@osm/shared";
import { Check, Loader2 } from "lucide-react";
import { cn } from "../../lib/cn";

const stages: Array<{ key: AnalysisStage; label: string; detail: string }> = [
  { key: "fetching-profile", label: "Fetching profile", detail: "Resolving the public GitHub identity." },
  {
    key: "inspecting-repositories",
    label: "Inspecting repositories",
    detail: "Reading bounded repository metadata and READMEs.",
  },
  {
    key: "building-evidence",
    label: "Building skill evidence",
    detail: "Extracting languages, topics and manifest signals.",
  },
  {
    key: "generating-skills",
    label: "Generating skill profile",
    detail: "Structuring evidence into assessments with confidence.",
  },
  {
    key: "discovering-issues",
    label: "Discovering issues",
    detail: "Searching open, non-pull-request issues.",
  },
  {
    key: "ranking-opportunities",
    label: "Ranking opportunities",
    detail: "Applying eligibility filters and the weighted score.",
  },
];

function Heart({
  fill,
  index,
}: {
  fill: number;
  index: number;
}) {
  const filled = fill >= 100;
  const partial = fill > 0 && fill < 100;

  return (
    <svg
      viewBox="0 0 16 16"
      className={cn(
        "h-[18px] w-[18px] sm:h-[22px] sm:w-[22px] transition-transform duration-300",
        filled && "scale-110",
        partial && "scale-105",
      )}
      aria-hidden="true"
    >
      <defs>
        {partial && (
          <linearGradient id={`heart-fill-${index}`}>
            <stop offset={`${fill}%`} stopColor="#6DBE63" />
            <stop offset={`${fill}%`} stopColor="#DCCFE2" />
          </linearGradient>
        )}
      </defs>
      <path
        d="M8 13.5c0 0-4-3-4-5.5 0-1.4 1-2.5 2-2.5s2 1 2 1.5 1-1.5 2-1.5 2 1.1 2 2.5c0 2.5-4 5.5-4 5.5z"
        fill={
          filled ? "#6DBE63" : partial ? `url(#heart-fill-${index})` : "#DCCFE2"
        }
        stroke={filled ? "#3F7D39" : "#B8A8C0"}
        strokeWidth="0.8"
      />
    </svg>
  );
}

export function StageProgress({
  status,
  stage,
}: {
  status: AnalysisStatus;
  stage: AnalysisStage;
}) {
  const currentIndex =
    stage === "completed" ? stages.length : stages.findIndex((item) => item.key === stage);
  const activeIndex = currentIndex < 0 ? 0 : currentIndex;
  const progress =
    status === "queued"
      ? 0
      : stage === "completed"
        ? 100
        : Math.min(
            100,
            Math.round(
              ((activeIndex + (status === "running" ? 0.5 : 0)) / stages.length) * 100,
            ),
          );
  const hearts = 5;
  const activeStage = stages[Math.min(activeIndex, stages.length - 1)];

  return (
    <div className="surface panel-pad">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <p className="eyebrow">Analysis progress</p>
          <p className="mt-1 text-sm text-secondary">
            {status === "queued"
              ? "Queued — waiting for a worker."
              : `${activeStage?.label ?? "Finalizing"} · stages update as the backend works.`}
          </p>
        </div>
        <Loader2 className="h-4 w-4 animate-spin text-green-deep" aria-hidden="true" />
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-secondary">
            {status === "queued" ? "Waiting to start" : "Analyzing skill set"}
          </span>
          <span className="font-mono text-xs tabular-nums text-secondary">{progress}%</span>
        </div>

        <div
          className="mt-3 flex items-center gap-1 sm:gap-1.5"
          role="progressbar"
          aria-label="Analysis progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          {Array.from({ length: hearts }, (_, i) => {
            const heartFill = Math.max(0, Math.min(100, (progress - i * (100 / hearts)) * (100 / (100 / hearts))));
            return (
              <div
                key={i}
                className={cn(
                  "relative",
                  status === "running" && heartFill < 100 && heartFill > 0 && "animate-bounce",
                )}
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <Heart fill={heartFill} index={i} />
              </div>
            );
          })}
        </div>
      </div>

      <ol className="mt-6 space-y-0">
        {stages.map((item, index) => {
          const isDone = index < currentIndex;
          const isActive = index === currentIndex;
          return (
            <li key={item.key} className="relative flex gap-4 pb-5 last:pb-0">
              {index < stages.length - 1 && (
                <span
                  className={cn(
                    "absolute left-[11px] top-6 h-[calc(100%-12px)] w-px",
                    isDone ? "bg-green/50" : "bg-line",
                  )}
                  aria-hidden="true"
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex h-[23px] w-[23px] shrink-0 items-center justify-center rounded-full border",
                  isDone && "border-green/60 bg-green/10 text-green-deep",
                  isActive && "border-green bg-green/15 text-green-deep",
                  !isDone && !isActive && "border-line bg-canvas text-muted",
                )}
                aria-hidden="true"
              >
                {isDone ? (
                  <Check size={12} />
                ) : isActive ? (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green" />
                ) : (
                  <span className="h-1 w-1 rounded-full bg-muted/60" />
                )}
              </span>
              <div className="pt-0.5">
                <p
                  className={cn(
                    "text-sm font-medium",
                    isDone || isActive ? "text-ink" : "text-secondary",
                  )}
                >
                  {item.label}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-secondary">{item.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}