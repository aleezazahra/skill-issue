import { config } from "../config";
import { AppError } from "../lib/errors";
import type { AIProvider, GenerateOptions, GenerateResult, ProviderHealth } from "./types";

export class OpenRouterProvider implements AIProvider {
  readonly name = "openrouter";
  readonly model: string;

  constructor(model = config.openrouter.model) {
    this.model = model;
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    if (!config.openrouter.apiKey || !this.model) {
      throw new AppError("ai_not_configured", "OpenRouter is not configured.", 503);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.limits.aiTimeoutMs);
    try {
      const response = await fetch(`${config.openrouter.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.openrouter.apiKey}`,
          "HTTP-Referer": config.webOrigin,
          "X-Title": "OpenSource Matchmaker",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          temperature: options.temperature ?? 0.2,
          max_tokens: options.maxTokens ?? 1800,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: options.system },
            { role: "user", content: options.user },
          ],
        }),
      });

      if (!response.ok) {
        const status = response.status;
        throw new AppError(
          "ai_unavailable",
          status === 401
            ? "The hosted model rejected its credentials."
            : `Hosted model request failed with status ${status}.`,
          502,
        );
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = data.choices?.[0]?.message?.content?.trim();
      if (!text) {
        throw new AppError("ai_empty_response", "The hosted model returned an empty response.", 502);
      }
      return { text, model: this.model, provider: this.name };
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new AppError("ai_timeout", "The hosted model took too long to respond.", 504);
      }
      throw new AppError("ai_unavailable", "The hosted model could not be reached.", 502);
    } finally {
      clearTimeout(timer);
    }
  }

  async health(): Promise<ProviderHealth> {
    if (!config.openrouter.apiKey || !this.model) {
      return { ok: false, detail: "OpenRouter is not configured" };
    }
    return { ok: true, detail: "Configured; will be verified on first request" };
  }
}
