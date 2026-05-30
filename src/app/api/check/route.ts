import {
  NpmRegistryError,
  runSafetyCheck,
} from "@/lib/services/safety-orchestrator";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  const version = searchParams.get("version") ?? undefined;

  if (!name?.trim()) {
    return Response.json(
      {
        error: {
          code: "MISSING_NAME",
          message: "Query param `name` is required.",
        },
      },
      { status: 400 }
    );
  }

  try {
    const report = await runSafetyCheck(name, version);
    return Response.json(report);
  } catch (error) {
    if (error instanceof NpmRegistryError) {
      const status =
        error.code === "NOT_FOUND" ? 404 : error.code === "INVALID" ? 400 : 502;
      return Response.json(
        { error: { code: error.code, message: error.message } },
        { status }
      );
    }
    return Response.json(
      {
        error: {
          code: "UNKNOWN",
          message: "Unexpected error checking package.",
        },
      },
      { status: 500 }
    );
  }
}
