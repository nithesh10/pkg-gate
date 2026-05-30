import { assertEnv } from "@/lib/server/env";

export type AiEnvError = {
  code: "MISSING_OPENAI_API_KEY";
  message: string;
};

export function requireOpenAIKey():
  | { ok: true; apiKey: string }
  | { ok: false; error: AiEnvError } {
  try {
    return { ok: true, apiKey: assertEnv("OPENAI_API_KEY") };
  } catch {
    return {
      ok: false,
      error: {
        code: "MISSING_OPENAI_API_KEY",
        message:
          "Set OPENAI_API_KEY in .env.local to enable the AI chat stub.",
      },
    };
  }
}
