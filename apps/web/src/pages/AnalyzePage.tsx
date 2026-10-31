import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Check, FileSearch, Github, Loader2, Lock, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/Button";
import { ErrorNotice } from "../components/Feedback";
import { ApiError, api } from "../lib/api";
import { rememberSession } from "../lib/recentSessions";

const inspected = [
  "Public profile and non-fork repositories",
  "Language metadata, topics and READMEs",
  "Selected manifest files such as package.json",
  "Open issues matched to your evidenced stack",
];

const avoided = [
  "Passwords or private repository access",
  "Cloning entire repositories",
  "Automatic pull-request submission",
  "Skill claims without supporting evidence",
];

export function AnalyzePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [username, setUsername] = useState(params.get("username") ?? "");
  const [error, setError] = useState<ApiError | null>(null);

  const mutation = useMutation({
    mutationFn: (value: string) => api.startAnalysis(value),
    onSuccess: (data, value) => {
      rememberSession({
        analysisId: data.analysisId,
        username: value,
        repositoriesAnalyzed: 0,
        status: "queued",
        updatedAt: new Date().toISOString(),
      });
      navigate(`/analysis/${data.analysisId}`);
    },
    onError: (value) => {
      setError(value instanceof ApiError ? value : new ApiError("Analysis could not start.", "unknown", 0));
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const value = username.trim().replace(/^@/, "");
    if (!value) {
      setError(new ApiError("Enter a GitHub username to begin.", "validation_error", 400));
      return;
    }
    mutation.mutate(value);
  }

  return (
    <div className="page-shell py-12 sm:py-16">
      <div className="grid gap-12 lg:grid-cols-[1fr_0.8fr] lg:gap-20">
        <div className="max-w-xl">
          <p className="eyebrow mb-5">New analysis</p>
          <h1 className="text-[clamp(2.4rem,4.6vw,3.9rem)]">
            Start with a public GitHub profile.
          </h1>
          <p className="display-copy mt-5">
            We will inspect a bounded set of public repositories, build an evidence bundle and rank
            real open issues against it. Nothing is written back to GitHub.
          </p>

          <form onSubmit={submit} className="mt-9 space-y-4" noValidate>
            <div>
              <label htmlFor="username" className="field-label">
                GitHub username
              </label>
              <div className="relative">
                <span
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-muted"
                  aria-hidden="true"
                >
                  @
                </span>
                <input
                  id="username"
                  name="username"
                  className="field pl-9"
                  placeholder="octocat"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "username-error" : "username-hint"}
                  disabled={mutation.isPending}
                />
              </div>
              <p id="username-hint" className="mt-2 text-xs text-muted">
                Public profiles only. A GitHub token on the server raises API limits.
              </p>
            </div>

            {error && (
              <div id="username-error">
                <ErrorNotice
                  title="Analysis could not start"
                  message={error.message}
                  action={
                    error.code === "github_rate_limited" ? (
                      <p className="text-xs text-muted">
                        Set <code className="text-secondary">GITHUB_TOKEN</code> in the API
                        environment and restart the backend.
                      </p>
                    ) : undefined
                  }
                />
              </div>
            )}

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
              <Button type="submit" size="lg" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Starting analysis
                  </>
                ) : (
                  <>
                    Analyze profile
                    <ArrowRight size={17} aria-hidden="true" />
                  </>
                )}
              </Button>
              <Button href="https://github.com" variant="ghost" size="lg">
                <Github size={16} aria-hidden="true" />
                Find a username
              </Button>
            </div>
          </form>
        </div>

        <aside className="space-y-4 self-start">
          <div className="surface panel-pad">
            <div className="flex items-center gap-2 border-b border-line pb-4">
              <FileSearch className="h-4 w-4 text-green" aria-hidden="true" />
              <h2 className="text-base font-semibold">What gets inspected</h2>
            </div>
            <ul className="mt-4 space-y-3">
              {inspected.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-secondary">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="surface panel-pad">
            <div className="flex items-center gap-2 border-b border-line pb-4">
              <Lock className="h-4 w-4 text-muted" aria-hidden="true" />
              <h2 className="text-base font-semibold">What never happens</h2>
            </div>
            <ul className="mt-4 space-y-3">
              {avoided.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-secondary">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="px-1 font-mono text-[11px] leading-relaxed tracking-[0.06em] text-muted">
            Analyses are kept in memory for this MVP. Restarting the API clears saved results.
          </p>
        </aside>
      </div>
    </div>
  );
}
