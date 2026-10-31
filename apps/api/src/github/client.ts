import { config } from "../config";
import { AppError } from "../lib/errors";
import { truncate } from "../lib/json";
import type {
  GitHubIssueItem,
  GitHubRepo,
  GitHubTree,
  GitHubUser,
  IssueSearchResult,
} from "./types";

interface CacheEntry {
  expiresAt: number;
  value: unknown;
}

class GitHubClient {
  private cache = new Map<string, CacheEntry>();

  private headers(accept = "application/vnd.github+json"): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: accept,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "opensource-matchmaker",
    };
    if (config.github.token) {
      headers.Authorization = `Bearer ${config.github.token}`;
    }
    return headers;
  }

  private async request(path: string, accept?: string): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.limits.githubTimeoutMs);
    try {
      const response = await fetch(`${config.github.baseUrl}${path}`, {
        headers: this.headers(accept),
        signal: controller.signal,
      });

      if (response.status === 404) {
        throw new AppError("github_not_found", "That GitHub resource could not be found.", 404);
      }

      if (response.status === 403 || response.status === 429) {
        const remaining = response.headers.get("x-ratelimit-remaining");
        const retryAfter = response.headers.get("retry-after");
        if (remaining === "0" || retryAfter || response.status === 429) {
          throw new AppError(
            "github_rate_limited",
            "GitHub's rate limit was reached. Add a GITHUB_TOKEN or try again shortly.",
            429,
          );
        }
      }

      if (!response.ok) {
        throw new AppError(
          "github_error",
          `GitHub request failed with status ${response.status}.`,
          response.status >= 500 ? 502 : 502,
        );
      }

      return response;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new AppError("github_timeout", "GitHub did not respond in time.", 504);
      }
      throw new AppError("github_unavailable", "GitHub could not be reached.", 502);
    } finally {
      clearTimeout(timer);
    }
  }

  private async cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
    const hit = this.cache.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      return hit.value as T;
    }
    const value = await fn();
    this.cache.set(key, { expiresAt: Date.now() + ttlMs, value });
    return value;
  }

  async getUser(username: string): Promise<GitHubUser> {
    return this.cached(`user:${username.toLowerCase()}`, 5 * 60_000, async () => {
      const response = await this.request(`/users/${encodeURIComponent(username)}`);
      return (await response.json()) as GitHubUser;
    });
  }

  async getRepositories(username: string): Promise<GitHubRepo[]> {
    return this.cached(`repos:${username.toLowerCase()}`, 5 * 60_000, async () => {
      const response = await this.request(
        `/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated&type=owner`,
      );
      return (await response.json()) as GitHubRepo[];
    });
  }

  async getRepo(fullName: string): Promise<GitHubRepo> {
    return this.cached(`repo:${fullName.toLowerCase()}`, 10 * 60_000, async () => {
      const response = await this.request(`/repos/${fullName}`);
      return (await response.json()) as GitHubRepo;
    });
  }

  async getLanguages(fullName: string): Promise<Record<string, number>> {
    return this.cached(`languages:${fullName.toLowerCase()}`, 30 * 60_000, async () => {
      const response = await this.request(`/repos/${fullName}/languages`);
      return (await response.json()) as Record<string, number>;
    });
  }

  async getReadme(fullName: string): Promise<string | null> {
    return this.cached(`readme:${fullName.toLowerCase()}`, 30 * 60_000, async () => {
      try {
        const response = await this.request(
          `/repos/${fullName}/readme`,
          "application/vnd.github.raw",
        );
        const text = await response.text();
        return truncate(text, config.limits.maxReadmeChars);
      } catch (error) {
        if (error instanceof AppError && error.code === "github_not_found") return null;
        throw error;
      }
    });
  }

  async getTree(fullName: string, branch: string): Promise<GitHubTree | null> {
    return this.cached(`tree:${fullName.toLowerCase()}:${branch}`, 10 * 60_000, async () => {
      try {
        const response = await this.request(
          `/repos/${fullName}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
        );
        return (await response.json()) as GitHubTree;
      } catch (error) {
        if (error instanceof AppError && error.code === "github_not_found") return null;
        throw error;
      }
    });
  }

  async getFile(fullName: string, path: string, branch: string): Promise<string | null> {
    return this.cached(`file:${fullName.toLowerCase()}:${branch}:${path}`, 30 * 60_000, async () => {
      try {
        const response = await this.request(
          `/repos/${fullName}/contents/${path}?ref=${encodeURIComponent(branch)}`,
          "application/vnd.github.raw",
        );
        const text = await response.text();
        return truncate(text, config.limits.maxManifestChars);
      } catch (error) {
        if (error instanceof AppError && error.code === "github_not_found") return null;
        throw error;
      }
    });
  }

  async searchIssues(query: string, perPage: number): Promise<IssueSearchResult> {
    const params = new URLSearchParams({
      q: query,
      sort: "updated",
      order: "desc",
      per_page: String(Math.min(perPage, 50)),
    });
    return this.cached(`search:${query}:${perPage}`, 10 * 60_000, async () => {
      const response = await this.request(`/search/issues?${params.toString()}`);
      const data = (await response.json()) as {
        total_count: number;
        items: GitHubIssueItem[];
      };
      return { items: data.items ?? [], totalCount: data.total_count ?? 0 };
    });
  }

  async getIssue(fullName: string, number: number): Promise<GitHubIssueItem | null> {
    return this.cached(`issue:${fullName.toLowerCase()}:${number}`, 5 * 60_000, async () => {
      try {
        const response = await this.request(`/repos/${fullName}/issues/${number}`);
        return (await response.json()) as GitHubIssueItem;
      } catch (error) {
        if (error instanceof AppError && error.code === "github_not_found") return null;
        throw error;
      }
    });
  }
}

export const github = new GitHubClient();
