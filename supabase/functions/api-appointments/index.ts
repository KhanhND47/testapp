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
    const path = url.pathname.replace(/^\/api-appointments/, "") || "/";
    const method = req.method;

    if (path === "/" && method === "GET") {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("appointment_date", { ascending: true });
      if (error) return err(error.message);
      return json(data);
    }

    if (path === "/" && method === "POST") {
      const { appointment, items } = await req.json();
      const { data: created, error } = await supabase
        .from("appointments")
        .insert([appointment])
        .select()
        .maybeSingle();
      if (error) return err(error.message);

      if (items && items.length > 0 && created) {
        const itemsWithId = items.map((item: Record<string, unknown>) => ({
          ...item,
          appointment_id: created.id,
        }));
        const { error: itemErr } = await supabase
          .from("appointment_repair_items")
          .insert(itemsWithId);
        if (itemErr) return err(itemErr.message);
      }

      return json(created, 201);
    }

    const statusMatch = path.match(/^\/([^/]+)\/status$/);
    if (statusMatch && method === "PUT") {
      const id = statusMatch[1];
      const { status: newStatus } = await req.json();
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return err(error.message);
      return json({ success: true });
    }

    const detailMatch = path.match(/^\/([^/]+)$/);
    if (detailMatch && method === "GET") {
      const id = detailMatch[1];
      const [apptRes, itemsRes] = await Promise.all([
        supabase
          .from("appointments")
          .select("*")
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("appointment_repair_items")
          .select("*")
          .eq("appointment_id", id)
          .order("created_at"),
      ]);
      if (apptRes.error) return err(apptRes.error.message);
      return json({
        appointment: apptRes.data,
        items: itemsRes.data || [],
      });
    }

    if (detailMatch && method === "PUT") {
      const id = detailMatch[1];
      const { appointment, newItems, updatedItems, deletedItemIds } =
        await req.json();

      if (appointment) {
        const { error } = await supabase
          .from("appointments")
          .update({ ...appointment, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) return err(error.message);
      }

      if (deletedItemIds && deletedItemIds.length > 0) {
        await supabase
          .from("appointment_repair_items")
          .delete()
          .in("id", deletedItemIds);
      }

      if (updatedItems) {
        for (const item of updatedItems) {
          const { id: itemId, ...rest } = item;
          await supabase
            .from("appointment_repair_items")
            .update(rest)
            .eq("id", itemId);
        }
      }

      if (newItems && newItems.length > 0) {
        const itemsWithId = newItems.map(
          (item: Record<string, unknown>) => ({
            ...item,
            appointment_id: id,
          })
        );
        await supabase.from("appointment_repair_items").insert(itemsWithId);
      }

      return json({ success: true });
    }

    return err("Not found", 404);
  } catch (e) {
    return err(e.message || "Internal server error", 500);
  }
});
