import { config } from "../config";
import { AppError } from "../lib/errors";
import type { AIProvider, GenerateOptions, GenerateResult, ProviderHealth } from "./types";

async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fn(controller.signal);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AppError("ai_timeout", "The local model took too long to respond.", 504);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export class OllamaProvider implements AIProvider {
  readonly name = "ollama";
  readonly model: string;

  constructor(model = config.ollama.model) {
    this.model = model;
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    try {
      return await withTimeout(async (signal) => {
        const response = await fetch(`${config.ollama.baseUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal,
          body: JSON.stringify({
            model: this.model,
            stream: false,
            think: config.ollama.think,
            format: "json",
            options: {
              temperature: options.temperature ?? 0.2,
              num_predict: options.maxTokens ?? 1800,
            },
            messages: [
              { role: "system", content: options.system },
              { role: "user", content: options.user },
            ],
          }),
        });

        if (!response.ok) {
          throw new AppError(
            "ai_unavailable",
            `Ollama responded with status ${response.status}.`,
            502,
          );
        }

        const data = (await response.json()) as {
          message?: { content?: string };
        };
        const text = data.message?.content?.trim();
        if (!text) {
          throw new AppError("ai_empty_response", "The local model returned an empty response.", 502);
        }
        return { text, model: this.model, provider: this.name };
      }, config.limits.aiTimeoutMs);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        "ai_unavailable",
        "Could not reach Ollama. Make sure it is running and the model is installed.",
        502,
      );
    }
  }

  async health(): Promise<ProviderHealth> {
    try {
      return await withTimeout(async (signal) => {
        const response = await fetch(`${config.ollama.baseUrl}/api/tags`, { signal });
        if (!response.ok) return { ok: false, detail: `Ollama returned ${response.status}` };
        const data = (await response.json()) as { models?: Array<{ name?: string }> };
        const names = (data.models ?? []).map((m) => m.name ?? "");
        const installed = names.some((name) => name === this.model || name.startsWith(`${this.model}:`));
        return installed
          ? { ok: true }
          : { ok: false, detail: `Model ${this.model} is not installed` };
      }, 4000);
    } catch {
      return { ok: false, detail: "Ollama is not reachable" };
    }
  }
}
