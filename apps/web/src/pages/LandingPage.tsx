import {
  ArrowUpRight,
  Check,
  CircleDot,
  FileSearch,
  GitPullRequest,
  ShieldCheck,
} from "lucide-react";
import { Button } from "../components/Button";
import { HeroAnalyzer } from "../features/profile/HeroAnalyzer";
import { RecentSessions } from "../features/profile/RecentSessions";

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

const safeguards = [
  "Open, non-pull-request issues only",
  "Deterministic weighted score before any AI explanation",
  "Verified file paths only; unverified paths are omitted",
  "'Good first issue' is treated as a hint, not a guarantee",
];

export function LandingPage() {
  return (
    <>
      <section className="hero-pixel border-b border-line">
        <div className="page-shell py-20 sm:py-28 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-balance text-[clamp(2.8rem,7vw,6rem)] leading-[1.02]">
              Find your open-source contribution,
              <span className="text-green-deep"> minus the skill issue.</span>
            </h1>
            <p className="display-copy mx-auto mt-7 max-w-2xl">
              Match your public GitHub work to real issues, understand why they fit and leave with
              a plan you can defend. No repository cloning. No inflated skill claims.
            </p>
            <HeroAnalyzer />
            <a
              href="#how-it-works"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-secondary transition-colors hover:text-ink"
            >
              Explore how matching works
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
            <p className="mt-7 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
              Public evidence only · Password never requested · Local Gemma
            </p>
          </div>
        </div>
      </section>

      <RecentSessions />

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
                    <span className="font-mono text-[11px] tracking-[0.18em] text-green-deep">
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
        <div className="page-shell py-16 sm:py-20">
          <div className="max-w-3xl">
            <p className="eyebrow mb-4">The ranking engine</p>
            <h2 className="max-w-[16ch]">Explainable by construction.</h2>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-secondary">
              Every recommendation exposes its component scores and the reasons behind them.
              Missing information is recorded as unknown rather than silently scored as a perfect
              match. Scores are normalized from 0 to 100, and an inactive repository receives a
              weak activity signal without being automatically excluded.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {safeguards.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-green-deep" aria-hidden="true" />
                  <span className="text-sm leading-relaxed text-secondary">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="page-shell py-16 sm:py-20">
          <div className="surface panel-pad flex flex-col gap-8 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p className="eyebrow mb-4 flex items-center gap-2">
                <CircleDot className="h-3.5 w-3.5 text-green-deep" aria-hidden="true" />
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
