import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Github, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { ApiError, api } from "../../lib/api";
import { rememberSession } from "../../lib/recentSessions";

export function HeroAnalyzer() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

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
      setError(
        value instanceof ApiError
          ? value.message
          : "The analysis could not be started. Try again in a moment.",
      );
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const value = username.trim().replace(/^@/, "");
    if (!value) {
      setError("Enter a GitHub username to begin.");
      return;
    }
    mutation.mutate(value);
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto mt-9 w-full max-w-xl">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="hero-username" className="sr-only">
            GitHub username
          </label>
          <Github
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            id="hero-username"
            name="username"
            className="field h-12 pl-11 pr-4"
            placeholder="Enter a GitHub username"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "hero-username-error" : "hero-username-hint"}
            disabled={mutation.isPending}
          />
        </div>
        <Button type="submit" size="lg" disabled={mutation.isPending} className="shrink-0">
          {mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Starting
            </>
          ) : (
            <>
              Analyze
              <ArrowRight size={16} aria-hidden="true" />
            </>
          )}
        </Button>
      </div>

      <div className="mt-2.5 min-h-[18px] text-left sm:text-center">
        {error ? (
          <p id="hero-username-error" role="alert" className="text-xs text-danger">
            {error}
          </p>
        ) : (
          <p id="hero-username-hint" className="text-xs text-muted">
            Public profiles only. Sessions stay in this browser.
          </p>
        )}
      </div>
    </form>
  );
}
