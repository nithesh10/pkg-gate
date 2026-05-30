import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { requireOpenAIKey } from "@/lib/server/ai-env";

export const maxDuration = 30;

export async function POST(req: Request) {
  const env = requireOpenAIKey();
  if (!env.ok) {
    return Response.json(
      { error: env.error },
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  let messages: unknown;
  try {
    const body = await req.json();
    messages = body.messages;
    if (!Array.isArray(messages)) {
      return Response.json(
        { error: { code: "INVALID_BODY", message: "Expected messages array." } },
        { status: 400 }
      );
    }
  } catch {
    return Response.json(
      { error: { code: "INVALID_JSON", message: "Request body must be JSON." } },
      { status: 400 }
    );
  }

  const result = streamText({
    model: openai("gpt-4o-mini"),
    messages,
  });

  return result.toDataStreamResponse();
}
