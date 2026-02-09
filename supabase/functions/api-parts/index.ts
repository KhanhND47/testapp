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
    const path = url.pathname.replace(/^\/api-parts/, "") || "/";
    const method = req.method;

    if (path === "/" && method === "GET") {
      const { data, error } = await supabase
        .from("parts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return err(error.message);
      return json(data);
    }

    if (path === "/search" && method === "GET") {
      const q = url.searchParams.get("q") || "";
      const { data, error } = await supabase
        .from("parts")
        .select("*")
        .or(
          `part_name.ilike.%${q}%,part_code.ilike.%${q}%,supplier_name.ilike.%${q}%`
        )
        .order("part_name")
        .limit(50);
      if (error) return err(error.message);
      return json(data);
    }

    if (path === "/generate-code" && method === "POST") {
      const { data, error } = await supabase.rpc("generate_part_code");
      if (error) return err(error.message);
      return json({ code: data });
    }

    if (path === "/" && method === "POST") {
      if (user.role !== "admin") return err("Forbidden", 403);
      const body = await req.json();
      const { data, error } = await supabase
        .from("parts")
        .insert([body])
        .select()
        .maybeSingle();
      if (error) return err(error.message);
      return json(data, 201);
    }

    const idMatch = path.match(/^\/([^/]+)$/);
    if (idMatch && method === "PUT") {
      if (user.role !== "admin") return err("Forbidden", 403);
      const id = idMatch[1];
      const body = await req.json();
      const { error } = await supabase.from("parts").update(body).eq("id", id);
      if (error) return err(error.message);
      return json({ success: true });
    }

    if (idMatch && method === "DELETE") {
      if (user.role !== "admin") return err("Forbidden", 403);
      const id = idMatch[1];
      const { error } = await supabase.from("parts").delete().eq("id", id);
      if (error) return err(error.message);
      return json({ success: true });
    }

    return err("Not found", 404);
  } catch (e) {
    return err(e.message || "Internal server error", 500);
  }
});
