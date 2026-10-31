import { config, hasOpenRouter } from "../config";
import { AppError } from "../lib/errors";
import { OllamaProvider } from "./ollama";
import { OpenRouterProvider } from "./openrouter";
import type { AIProvider, GenerateOptions, GenerateResult, ProviderHealth } from "./types";

class FallbackProvider implements AIProvider {
  readonly name: string;
  readonly model: string;

  constructor(private readonly primary: AIProvider, private readonly fallback?: AIProvider) {
    this.name = primary.name;
    this.model = primary.model;
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    try {
      return await this.primary.generate(options);
    } catch (primaryError) {
      if (!this.fallback) throw primaryError;
      console.warn(
        `[ai] primary provider ${this.primary.name} failed; trying ${this.fallback.name}`,
      );
      try {
        return await this.fallback.generate(options);
      } catch {
        throw primaryError;
      }
    }
  }

  async health(): Promise<ProviderHealth> {
    const primary = await this.primary.health();
    if (primary.ok) return primary;
    if (!this.fallback) return primary;
    const fallback = await this.fallback.health();
    return fallback.ok
      ? { ok: true, detail: `${this.primary.name} unavailable; fallback ready` }
      : { ok: false, detail: primary.detail ?? fallback.detail };
  }
}

function createProvider(): AIProvider {
  const ollama = new OllamaProvider();
  const openrouter = hasOpenRouter ? new OpenRouterProvider() : undefined;

  if (config.aiProvider === "openrouter") {
    if (!openrouter) {
      throw new AppError(
        "ai_not_configured",
        "AI_PROVIDER is openrouter but OPENROUTER_API_KEY or OPENROUTER_MODEL is missing.",
        503,
      );
    }
    return ollama ? new FallbackProvider(openrouter, ollama) : openrouter;
  }

  return new FallbackProvider(ollama, openrouter);
}

export const aiProvider: AIProvider = createProvider();
export type { AIProvider, GenerateOptions };
