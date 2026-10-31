export interface GenerateOptions {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateResult {
  text: string;
  model: string;
  provider: string;
}

export interface ProviderHealth {
  ok: boolean;
  detail?: string;
}

export interface AIProvider {
  readonly name: string;
  readonly model: string;
  generate(options: GenerateOptions): Promise<GenerateResult>;
  health(): Promise<ProviderHealth>;
}
