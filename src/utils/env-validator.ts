interface EnvConfig {
  required: string[];
  optional: string[];
}

export function validateEnv(config: EnvConfig): { valid: boolean; missing: string[] } {
  const missing = config.required.filter(key => !import.meta.env[key]);
  if (missing.length > 0) {
    console.warn('[Env] Missing required environment variables:', missing);
  }
  return { valid: missing.length === 0, missing };
}
