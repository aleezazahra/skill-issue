import "dotenv/config";

function readInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

export const config = {
  port: readInt(process.env.PORT, 4000),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
  aiProvider: (process.env.AI_PROVIDER ?? "ollama").toLowerCase(),
  ollama: {
    baseUrl: (process.env.OLLAMA_BASE_URL ?? "http://localhost:11434").replace(/\/$/, ""),
    model: process.env.OLLAMA_MODEL ?? "gemma3n:e4b",
    fallbackModel: process.env.OLLAMA_FALLBACK_MODEL ?? "gemma3n:e2b",
    think: readBool(process.env.OLLAMA_THINK, false),
  },
  openrouter: {
    baseUrl: (process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1").replace(/\/$/, ""),
    apiKey: process.env.OPENROUTER_API_KEY ?? "",
    model: process.env.OPENROUTER_MODEL ?? "",
  },
  github: {
    token: process.env.GITHUB_TOKEN ?? "",
    baseUrl: "https://api.github.com",
  },
  limits: {
    maxRepositories: readInt(process.env.MAX_REPOSITORIES, 6),
    maxIssueResults: readInt(process.env.MAX_ISSUE_RESULTS, 24),
    aiTimeoutMs: readInt(process.env.AI_TIMEOUT_MS, 240_000),
    githubTimeoutMs: readInt(process.env.GITHUB_TIMEOUT_MS, 15_000),
    maxReadmeChars: 2600,
    maxManifestChars: 5000,
    maxParallelRepoFetches: 3,
  },
} as const;

export const hasOpenRouter = Boolean(config.openrouter.apiKey && config.openrouter.model);
