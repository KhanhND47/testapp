import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { jwtVerify } from "npm:jose@5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey, x-app-token",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const jwtSecret = new TextEncoder().encode(
  "APP:" + Deno.env.get("SUPABASE_JWT_SECRET")!
);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function err(msg: string, status = 400) {
  return json({ error: msg }, status);
}

async function getUser(req: Request) {
  const token = req.headers.get("x-app-token");
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, jwtSecret);
    return { id: payload.sub as string, role: payload.role as string };
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const user = await getUser(req);
    if (!user) return err("Unauthorized", 401);

    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/api-settings/, "") || "/";
    const method = req.method;

    if (path === "/" && method === "GET") {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .in("setting_key", [
          "telegram_bot_token",
          "telegram_notifications_enabled",
          "gemini_api_key",
        ]);
      if (error) return err(error.message);
      return json(data);
    }

    if (path === "/" && method === "PUT") {
      if (user.role !== "admin") return err("Forbidden", 403);
      const { updates } = await req.json();
      for (const update of updates) {
        const { error } = await supabase
          .from("app_settings")
          .update({
            setting_value: update.setting_value,
            updated_at: new Date().toISOString(),
          })
          .eq("setting_key", update.setting_key);
        if (error) return err(error.message);
      }
      return json({ success: true });
    }

    if (path === "/workers" && method === "GET") {
      const { data, error } = await supabase
        .from("repair_workers")
        .select("*")
        .order("name");
      if (error) return err(error.message);
      return json(data);
    }

    const workerMatch = path.match(/^\/workers\/([^/]+)$/);
    if (workerMatch && method === "PUT") {
      const workerId = workerMatch[1];
      const body = await req.json();
      const { error } = await supabase
        .from("repair_workers")
        .update(body)
        .eq("id", workerId);
      if (error) return err(error.message);
      return json({ success: true });
    }

    return err("Not found", 404);
  } catch (e) {
    return err(e.message || "Internal server error", 500);
  }
});
