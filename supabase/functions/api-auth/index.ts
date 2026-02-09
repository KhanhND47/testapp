import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SignJWT, jwtVerify } from "npm:jose@5";

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

const USER_SELECT = "id, username, display_name, role, worker_id, is_active";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/api-auth/, "") || "/";

    if (path === "/login" && req.method === "POST") {
      const { username, password } = await req.json();
      if (!username || !password) {
        return err("Username and password required");
      }

      const { data: user, error } = await supabase
        .from("app_users")
        .select(USER_SELECT)
        .eq("username", username)
        .eq("password", password)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !user || !user.role) {
        return err("Ten dang nhap hoac mat khau khong dung.", 401);
      }

      const token = await new SignJWT({
        sub: user.id,
        username: user.username,
        display_name: user.display_name,
        role: user.role,
        worker_id: user.worker_id,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("30d")
        .sign(jwtSecret);

      return json({ user, token });
    }

    if (path === "/verify" && req.method === "POST") {
      const appToken = req.headers.get("x-app-token");
      if (!appToken) return err("No token", 401);

      try {
        const { payload } = await jwtVerify(appToken, jwtSecret);

        const { data: user } = await supabase
          .from("app_users")
          .select(USER_SELECT)
          .eq("id", payload.sub)
          .eq("is_active", true)
          .maybeSingle();

        if (!user) return err("User not found or inactive", 401);
        return json({ user });
      } catch {
        return err("Invalid or expired token", 401);
      }
    }

    return err("Not found", 404);
  } catch (e) {
    return err(e.message || "Internal server error", 500);
  }
});
