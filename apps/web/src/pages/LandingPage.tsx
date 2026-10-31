import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleDot,
  FileSearch,
  GitPullRequest,
  ShieldCheck,
} from "lucide-react";
import { Button } from "../components/Button";
import { ScoreBar } from "../components/ScoreBar";

const exampleSkills = [
  { name: "TypeScript", confidence: 87, note: "Demonstrated" },
  { name: "React", confidence: 81, note: "Demonstrated" },
  { name: "Node.js", confidence: 72, note: "Observed" },
];

const steps = [
  {
    number: "01",
    title: "Evidence, not vibes",
    body: "We read public metadata, READMEs and selected manifest files. Every skill claim carries the repository and source that support it.",
    icon: FileSearch,
  },
  {
    number: "02",
    title: "A score you can inspect",
    body: "Eligibility filters run first. Then a deterministic formula weighs skill fit, issue clarity, scope, activity and ecosystem fit. No hidden model ranking.",
    icon: ShieldCheck,
  },
  {
    number: "03",
    title: "A plan, not a promise",
    body: "For a chosen issue, Gemma drafts an investigation plan grounded in verified paths, open questions and a pull-request checklist.",
    icon: GitPullRequest,
  },
];

const weights = [
  { label: "Skill fit", value: 35 },
  { label: "Issue clarity", value: 25 },
  { label: "Scope fit", value: 20 },
  { label: "Activity signal", value: 10 },
  { label: "Ecosystem fit", value: 10 },
];

export function LandingPage() {
  return (
    <>
      <section className="border-b border-line">
        <div className="page-shell grid items-center gap-14 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:py-24">
          <div>
            <p className="eyebrow mb-7 flex items-center gap-2.5">
              <span className="status-dot" aria-hidden="true" />
              Evidence-backed open source matching
            </p>
            <h1 className="max-w-[14ch] text-balance">
              Your next open-source contribution is <span className="text-green">out there.</span>
            </h1>
            <p className="display-copy mt-7 max-w-xl">
              Match your GitHub experience to real issues, understand why they fit and leave with a
              plan to contribute. No repository cloning. No inflated skill claims.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button to="/analyze" size="lg">
                Analyze GitHub profile
                <ArrowRight size={17} aria-hidden="true" />
              </Button>
              <Button href="#how-it-works" variant="secondary" size="lg">
                Explore how matching works
              </Button>
            </div>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              Public evidence only · Password never requested
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-3 rounded-[22px] border border-line/60 bg-grid opacity-60" aria-hidden="true" />
            <div className="relative surface overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  Illustrative profile
                </span>
                <span className="chip chip-accent">Evidence</span>
              </div>

              <div className="space-y-5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">@sample-developer</p>
                    <p className="text-xs text-muted">6 repositories inspected</p>
                  </div>
                  <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-secondary">
                    Gemma 2
                  </span>
                </div>

                <div className="space-y-3">
                  {exampleSkills.map((skill) => (
                    <div key={skill.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-secondary">{skill.name}</span>
                        <span className="font-mono text-[11px] text-muted">
                          {skill.confidence}% · {skill.note}
                        </span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-canvas">
                        <div
                          className="h-full rounded-full bg-green"
                          style={{ width: `${skill.confidence}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-[10px] border border-line bg-canvas/60 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                        example/react-dashboard
                      </p>
                      <p className="text-sm font-medium leading-snug text-ink">
                        Improve keyboard navigation in the data table
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-2xl font-light tabular-nums text-green">82</p>
                      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">match</p>
                    </div>
                  </div>
                  <div className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-2">
                    <ScoreBar value={90} label="Skill fit" compact />
                    <ScoreBar value={85} label="Clarity" compact />
                    <ScoreBar value={75} label="Scope" compact />
                    <ScoreBar value={80} label="Ecosystem" compact />
                  </div>
                </div>

                <div className="flex items-start gap-2 text-xs text-muted">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green" aria-hidden="true" />
                  <span>Reasons and unknowns stay visible. Illustrative values, not a real profile.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 border-b border-line">
        <div className="page-shell py-16 sm:py-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow mb-4">How it works</p>
              <h2 className="max-w-[18ch]">A match you can defend.</h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted">
              GitHub supplies facts. Application code calculates the ranking. Gemma interprets the
              evidence and drafts next steps. Each layer stays inspectable.
            </p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-panel border border-line bg-line md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <article key={step.number} className="bg-surface p-6 sm:p-7">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] tracking-[0.18em] text-green">
                      {step.number}
                    </span>
                    <Icon className="h-4 w-4 text-muted" aria-hidden="true" />
                  </div>
                  <h3 className="mt-8 text-xl">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-secondary">{step.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="scoring" className="scroll-mt-24 border-b border-line">
        <div className="page-shell grid gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="eyebrow mb-4">The ranking engine</p>
            <h2 className="max-w-[16ch]">Explainable by construction.</h2>
            <p className="mt-6 max-w-lg text-sm leading-relaxed text-secondary">
              Every recommendation exposes its component scores and the reasons behind them. Missing
              information is recorded as unknown rather than silently scored as a perfect match.
            </p>

            <div className="mt-8 space-y-3">
              {[
                "Open, non-pull-request issues only",
                "Deterministic weighted score before any AI explanation",
                "Verified file paths only; unverified paths are omitted",
                "'Good first issue' is treated as a hint, not a guarantee",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-green" aria-hidden="true" />
                  <span className="text-sm text-secondary">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="surface panel-pad self-start">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                MVP weighting
              </span>
              <span className="chip">Configurable</span>
            </div>
            <div className="mt-5 space-y-4">
              {weights.map((weight) => (
                <div key={weight.label} className="flex items-center gap-4">
                  <span className="w-32 shrink-0 text-sm text-secondary">{weight.label}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas">
                    <div className="h-full rounded-full bg-green" style={{ width: `${weight.value * 2.5}%` }} />
                  </div>
                  <span className="w-9 text-right font-mono text-xs text-muted">
                    {weight.value}%
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-muted">
              Scores are normalized from 0 to 100. An inactive repository receives a weak activity
              signal but is not automatically excluded.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="page-shell py-16 sm:py-20">
          <div className="surface panel-pad flex flex-col gap-8 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p className="eyebrow mb-4 flex items-center gap-2">
                <CircleDot className="h-3.5 w-3.5 text-green" aria-hidden="true" />
                Start here
              </p>
              <h2 className="max-w-[18ch]">Start with a username.</h2>
              <p className="mt-4 text-sm leading-relaxed text-secondary">
                In a few minutes, see what your public work demonstrates, which issues are worth
                opening and why.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
              <Button to="/analyze" size="lg">
                Analyze a profile
                <ArrowUpRight size={17} aria-hidden="true" />
              </Button>
              <Button href="https://github.com" variant="secondary" size="lg">
                Browse GitHub
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
