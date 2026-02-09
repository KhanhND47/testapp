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
    const path = url.pathname.replace(/^\/api-marketing/, "") || "/";
    const method = req.method;

    if (path === "/goals" && method === "GET") {
      const { data, error } = await supabase
        .from("marketing_goals")
        .select("*")
        .order("created_at");
      if (error) return err(error.message);
      return json(data);
    }

    const goalMatch = path.match(/^\/goals\/([^/]+)$/);
    if (goalMatch && method === "PUT") {
      const id = goalMatch[1];
      const body = await req.json();
      const { error } = await supabase
        .from("marketing_goals")
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return err(error.message);
      return json({ success: true });
    }

    if (path === "/videos" && method === "GET") {
      const contentLine = url.searchParams.get("content_line");
      let query = supabase
        .from("marketing_videos")
        .select("*, marketing_video_stages(*)")
        .order("created_at", { ascending: false });

      if (contentLine) {
        query = query.eq("content_line", contentLine);
      }

      const { data, error } = await query;
      if (error) return err(error.message);
      return json(data);
    }

    if (path === "/videos" && method === "POST") {
      const body = await req.json();
      const { data, error } = await supabase
        .from("marketing_videos")
        .insert([body])
        .select()
        .maybeSingle();
      if (error) return err(error.message);
      return json(data, 201);
    }

    const videoMatch = path.match(/^\/videos\/([^/]+)$/);
    if (videoMatch && method === "PUT") {
      const id = videoMatch[1];
      const body = await req.json();
      const { error } = await supabase
        .from("marketing_videos")
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return err(error.message);
      return json({ success: true });
    }

    if (videoMatch && method === "GET") {
      const id = videoMatch[1];
      const { data, error } = await supabase
        .from("marketing_videos")
        .select("*, marketing_video_stages(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) return err(error.message);
      return json(data);
    }

    const stagesMatch = path.match(/^\/videos\/([^/]+)\/stages$/);
    if (stagesMatch && method === "POST") {
      const videoId = stagesMatch[1];
      const { stages } = await req.json();
      const stagesWithId = stages.map(
        (s: Record<string, unknown>) => ({
          ...s,
          video_id: videoId,
        })
      );
      const { data, error } = await supabase
        .from("marketing_video_stages")
        .insert(stagesWithId)
        .select();
      if (error) return err(error.message);
      return json(data, 201);
    }

    const stageMatch = path.match(/^\/stages\/([^/]+)$/);
    if (stageMatch && method === "PUT") {
      const id = stageMatch[1];
      const body = await req.json();
      const { error } = await supabase
        .from("marketing_video_stages")
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return err(error.message);
      return json({ success: true });
    }

    return err("Not found", 404);
  } catch (e) {
    return err(e.message || "Internal server error", 500);
  }
});
