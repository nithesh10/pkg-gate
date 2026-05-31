import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  deleteWatchedPackage,
  listWatchedPackages,
  saveWatchedPackage,
} from "@/lib/services/watched-packages";
import type { SafetyReport } from "@/lib/services/safety/types";

function supabaseConfigError() {
  return Response.json(
    {
      error: {
        code: "SUPABASE_NOT_CONFIGURED",
        message: "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      },
    },
    { status: 503 }
  );
}

function authRequired() {
  return Response.json(
    {
      error: {
        code: "AUTH_REQUIRED",
        message: "Sign in to manage your watchlist.",
      },
    },
    { status: 401 }
  );
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return supabaseConfigError();
  }

  try {
    const supabase = await createClient();
    const packages = await listWatchedPackages(supabase);
    return Response.json({ packages });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load watched packages.";
    return Response.json(
      { error: { code: "DB_ERROR", message } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return supabaseConfigError();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: { code: "INVALID_JSON", message: "Request body must be JSON." } },
      { status: 400 }
    );
  }

  const payload = body as { report?: SafetyReport };

  if (!payload.report?.name || !payload.report?.version) {
    return Response.json(
      {
        error: {
          code: "INVALID_BODY",
          message: "Required: report (SafetyReport with name and version).",
        },
      },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return authRequired();

    const saved = await saveWatchedPackage(supabase, payload.report, user.id);
    return Response.json({ package: saved });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save watched package.";
    return Response.json(
      { error: { code: "DB_ERROR", message } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!isSupabaseConfigured()) {
    return supabaseConfigError();
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return Response.json(
      { error: { code: "MISSING_ID", message: "Query param `id` is required." } },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return authRequired();

    await deleteWatchedPackage(supabase, id);
    return Response.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete watched package.";
    return Response.json(
      { error: { code: "DB_ERROR", message } },
      { status: 500 }
    );
  }
}
