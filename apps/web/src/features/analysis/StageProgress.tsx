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

export function StageProgress({
  status,
  stage,
}: {
  status: AnalysisStatus;
  stage: AnalysisStage;
}) {
  const currentIndex =
    stage === "completed" ? stages.length : stages.findIndex((item) => item.key === stage);

  return (
    <div className="surface panel-pad">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <p className="eyebrow">Analysis progress</p>
          <p className="mt-1 text-sm text-secondary">
            {status === "queued"
              ? "Queued — waiting for a worker."
              : "Working through real stages. No fabricated percentage."}
          </p>
        </div>
        <Loader2 className="h-4 w-4 animate-spin text-green" aria-hidden="true" />
      </div>

      <ol className="mt-5 space-y-0">
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
                  isDone && "border-green/60 bg-green/10 text-green",
                  isActive && "border-green bg-green/15 text-green",
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
                    isDone || isActive ? "text-ink" : "text-muted",
                  )}
                >
                  {item.label}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">{item.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
