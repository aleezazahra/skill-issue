import { cn } from "../lib/cn";

export const componentLabels: Record<string, string> = {
  skillFit: "Skill fit",
  issueClarity: "Issue clarity",
  scopeFit: "Scope fit",
  activitySignal: "Activity",
  ecosystemFit: "Ecosystem",
};

export function ScoreBar({
  value,
  label,
  compact = false,
}: {
  value: number;
  label: string;
  compact?: boolean;
}) {
  const tone =
    value >= 75 ? "bg-green" : value >= 55 ? "bg-[#C7A85E]" : "bg-[#A9B4C4]";
  return (
    <div className={cn("space-y-1.5", compact && "space-y-1")}>
      <div className="flex items-baseline justify-between gap-3">
        <span className={cn("data-label", compact && "text-[10px]")}>{label}</span>
        <span className="font-mono text-xs text-secondary">{value}</span>
      </div>
      <div
        className="h-1 overflow-hidden rounded-full bg-canvas"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
