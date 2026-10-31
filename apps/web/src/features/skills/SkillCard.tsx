import type { SkillAssessment, SkillEvidence } from "@osm/shared";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";

const assessmentCopy: Record<SkillAssessment["assessment"], string> = {
  observed: "Observed",
  demonstrated: "Demonstrated",
  inferred: "Inferred",
};

export function SkillCard({
  skill,
  evidence,
}: {
  skill: SkillAssessment;
  evidence: SkillEvidence[];
}) {
  const supporting = skill.evidenceIds
    .map((id) => evidence.find((item) => item.id === id))
    .filter((item): item is SkillEvidence => Boolean(item));

  return (
    <article className="surface panel-pad flex flex-col">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium tracking-[-0.01em]">{skill.name}</h3>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            {supporting.length} supporting {supporting.length === 1 ? "record" : "records"}
          </p>
        </div>
        <span
          className={cn(
            "chip",
            skill.assessment === "demonstrated" && "chip-accent",
          )}
        >
          {assessmentCopy[skill.assessment]}
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          Assessment confidence
        </span>
        <span className="font-mono text-lg text-ink tabular-nums">
          {Math.round(skill.confidence * 100)}%
        </span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-canvas">
        <div
          className="h-full rounded-full bg-green"
          style={{ width: `${Math.round(skill.confidence * 100)}%` }}
        />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-secondary">{skill.explanation}</p>

      {supporting.length > 0 && (
        <details className="group mt-4 border-t border-line pt-3">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-medium text-secondary transition-colors hover:text-ink">
            Inspect evidence
            <ChevronDown
              className="h-3.5 w-3.5 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <ul className="mt-3 space-y-2.5">
            {supporting.map((item) => (
              <li key={item.id} className="rounded-[8px] border border-line bg-canvas/50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-secondary">{item.repository}</span>
                  <span className="chip !px-2 !py-0.5 !text-[9px]">{item.source}</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{item.detail}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}
