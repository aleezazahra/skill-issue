import type { BlueprintRecord } from "@osm/shared";
import {
  ArrowUpRight,
  Check,
  CircleHelp,
  ClipboardCheck,
  Compass,
  Copy,
  ExternalLink,
  FileCode2,
  ListChecks,
  Wrench,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import { relativeTime } from "../../lib/format";

function planText(blueprint: BlueprintRecord): string {
  const { content } = blueprint;
  const lines: string[] = [
    `# ${blueprint.issueTitle}`,
    `${blueprint.repository} · ${blueprint.issueUrl}`,
    "",
    "## Summary",
    content.summary,
    "",
    "## Why this matches",
    ...content.whyThisMatches.map((item) => `- ${item}`),
    "",
    "## Unknowns",
    ...content.unknowns.map((item) => `- ${item}`),
    "",
    "## Investigation",
    ...content.investigationSteps.flatMap((step, index) => [
      `${index + 1}. ${step.title}`,
      `   ${step.description}`,
      ...(step.verifiedPaths.length
        ? [`   Verified paths: ${step.verifiedPaths.join(", ")}`]
        : []),
    ]),
    "",
    "## Implementation",
    ...content.implementationSteps.map((item) => `- ${item}`),
    "",
    "## Validation",
    ...content.validationSteps.map((item) => `- ${item}`),
    "",
    "## Questions for maintainers",
    ...content.maintainerQuestions.map((item) => `- ${item}`),
    "",
    "## Pull request checklist",
    ...content.pullRequestChecklist.map((item) => `- [ ] ${item}`),
  ];
  return lines.join("\n");
}

function Section({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("surface panel-pad", className)}>
      <div className="flex items-center gap-2 border-b border-line pb-4">
        <span className="text-green" aria-hidden="true">
          {icon}
        </span>
        <h2 className="text-base font-semibold tracking-[-0.01em]">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function BulletList({
  items,
  marker = "check",
}: {
  items: string[];
  marker?: "check" | "question";
}) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-secondary">
          {marker === "check" ? (
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-green" aria-hidden="true" />
          ) : (
            <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          )}
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function BlueprintView({ blueprint }: { blueprint: BlueprintRecord }) {
  const [copied, setCopied] = useState(false);
  const { content } = blueprint;
  const verifiedPaths = [
    ...new Set(content.investigationSteps.flatMap((step) => step.verifiedPaths)),
  ];

  async function copyPlan() {
    try {
      await navigator.clipboard.writeText(planText(blueprint));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="space-y-6">
      <header className="surface panel-pad">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              {blueprint.repository}
            </p>
            <h1 className="mt-2 max-w-[32ch] text-[clamp(1.7rem,3.4vw,2.5rem)]">
              <a
                href={blueprint.issueUrl}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-green"
              >
                {blueprint.issueTitle}
              </a>
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted">
              <span>{blueprint.generatedBy === "gemma" ? blueprint.model : "Deterministic plan"}</span>
              <span aria-hidden="true">·</span>
              <span>{relativeTime(blueprint.createdAt)}</span>
              <span aria-hidden="true">·</span>
              <a
                href={blueprint.issueUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-secondary transition-colors hover:text-ink"
              >
                Open issue
                <ExternalLink size={11} aria-hidden="true" />
              </a>
            </div>
          </div>

          <button
            type="button"
            onClick={copyPlan}
            className="btn btn-secondary btn-sm shrink-0"
          >
            {copied ? (
              <>
                <Check size={14} aria-hidden="true" />
                Copied
              </>
            ) : (
              <>
                <Copy size={14} aria-hidden="true" />
                Copy plan
              </>
            )}
          </button>
        </div>
      </header>

      {blueprint.generatedBy === "deterministic" && (
        <p className="rounded-[10px] border border-line bg-surface px-4 py-3 text-xs leading-relaxed text-muted">
          This plan was assembled deterministically because the local model was unavailable. The
          structure is still grounded in the issue and verified repository metadata.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="space-y-6">
          <Section title="Summary" icon={<Compass size={16} />}>
            <p className="text-sm leading-relaxed text-secondary">{content.summary}</p>
          </Section>

          <Section title="Investigation steps" icon={<FileCode2 size={16} />}>
            <ol className="space-y-5">
              {content.investigationSteps.map((step, index) => (
                <li key={`${step.title}-${index}`} className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-canvas font-mono text-[11px] text-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{step.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-secondary">{step.description}</p>
                    {step.verifiedPaths.length > 0 && (
                      <ul className="mt-2.5 flex flex-wrap gap-1.5">
                        {step.verifiedPaths.map((path) => (
                          <li
                            key={path}
                            className="rounded-[6px] border border-line bg-canvas px-2 py-1 font-mono text-[10px] text-secondary"
                          >
                            {path}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Implementation plan" icon={<Wrench size={16} />}>
            <BulletList items={content.implementationSteps} />
          </Section>

          <Section title="Validation" icon={<ClipboardCheck size={16} />}>
            <BulletList items={content.validationSteps} />
          </Section>

          <Section title="Pull request checklist" icon={<ListChecks size={16} />}>
            <BulletList items={content.pullRequestChecklist} />
          </Section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6">
          <Section title="Why this matches" icon={<Check size={16} />}>
            <BulletList items={content.whyThisMatches} />
          </Section>

          <Section title="Still unknown" icon={<CircleHelp size={16} />}>
            <BulletList items={content.unknowns} marker="question" />
          </Section>

          <Section title="Verified files" icon={<FileCode2 size={16} />}>
            {verifiedPaths.length > 0 ? (
              <ul className="space-y-1.5">
                {verifiedPaths.map((path) => (
                  <li
                    key={path}
                    className="break-all rounded-[6px] border border-line bg-canvas px-2.5 py-1.5 font-mono text-[11px] text-secondary"
                  >
                    {path}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs leading-relaxed text-muted">
                No file paths were verified for this issue. Investigate the repository structure
                before editing.
              </p>
            )}
          </Section>

          <Section title="Ask maintainers" icon={<CircleHelp size={16} />}>
            <BulletList items={content.maintainerQuestions} marker="question" />
          </Section>

          <a
            href={blueprint.issueUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary w-full"
          >
            Open the issue
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </aside>
      </div>
    </article>
  );
}
