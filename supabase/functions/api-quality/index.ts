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
    return {
      id: payload.sub as string,
      role: payload.role as string,
      display_name: payload.display_name as string,
    };
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
    const path = url.pathname.replace(/^\/api-quality/, "") || "/";
    const method = req.method;

    if (path === "/pending" && method === "GET") {
      const { data: orders, error } = await supabase
        .from("general_repair_orders")
        .select("*")
        .eq("status", "completed");
      if (error) return err(error.message);

      const orderIds = (orders || []).map((o: { id: string }) => o.id);
      if (orderIds.length === 0) return json([]);

      const { data: existingInspections } = await supabase
        .from("quality_inspections")
        .select("repair_order_id")
        .in("repair_order_id", orderIds);

      const inspectedIds = new Set(
        (existingInspections || []).map(
          (i: { repair_order_id: string }) => i.repair_order_id
        )
      );
      const pending = (orders || []).filter(
        (o: { id: string }) => !inspectedIds.has(o.id)
      );

      for (const order of pending) {
        const { data: items } = await supabase
          .from("repair_items")
          .select("*")
          .eq("order_id", order.id)
          .eq("status", "completed");
        (order as Record<string, unknown>).completedItems = items || [];
      }

      return json(pending);
    }

    if (path === "/completed" && method === "GET") {
      const { data, error } = await supabase
        .from("quality_inspections")
        .select("*")
        .eq("status", "completed")
        .order("inspected_at", { ascending: false });
      if (error) return err(error.message);

      const orderIds = (data || []).map(
        (i: { repair_order_id: string }) => i.repair_order_id
      );
      if (orderIds.length > 0) {
        const { data: orders } = await supabase
          .from("general_repair_orders")
          .select("*")
          .in("id", orderIds);

        const orderMap = new Map(
          (orders || []).map((o: { id: string }) => [o.id, o])
        );
        for (const inspection of data || []) {
          (inspection as Record<string, unknown>).order = orderMap.get(
            inspection.repair_order_id
          );
        }
      }

      return json(data);
    }

    if (path === "/" && method === "POST") {
      const { inspection, items } = await req.json();
      const { data: created, error } = await supabase
        .from("quality_inspections")
        .insert([
          {
            ...inspection,
            inspector_name: user.display_name,
            inspected_at: new Date().toISOString(),
            status: "completed",
          },
        ])
        .select()
        .maybeSingle();
      if (error) return err(error.message);

      if (items && items.length > 0 && created) {
        const itemsWithId = items.map((item: Record<string, unknown>) => ({
          ...item,
          inspection_id: created.id,
        }));
        await supabase.from("quality_inspection_items").insert(itemsWithId);
      }

      return json(created, 201);
    }

    const detailMatch = path.match(/^\/([^/]+)$/);
    if (detailMatch && method === "GET") {
      const id = detailMatch[1];
      const [inspRes, itemsRes] = await Promise.all([
        supabase
          .from("quality_inspections")
          .select("*")
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("quality_inspection_items")
          .select("*")
          .eq("inspection_id", id),
      ]);
      if (inspRes.error) return err(inspRes.error.message);

      let order = null;
      if (inspRes.data) {
        const { data } = await supabase
          .from("general_repair_orders")
          .select("*")
          .eq("id", inspRes.data.repair_order_id)
          .maybeSingle();
        order = data;
      }

      return json({
        inspection: inspRes.data,
        items: itemsRes.data || [],
        order,
      });
    }

    const itemsMatch = path.match(/^\/([^/]+)\/items$/);
    if (itemsMatch && method === "GET") {
      const inspectionId = itemsMatch[1];
      const { data, error } = await supabase
        .from("quality_inspection_items")
        .select("*")
        .eq("inspection_id", inspectionId);
      if (error) return err(error.message);
      return json(data);
    }

    return err("Not found", 404);
  } catch (e) {
    return err(e.message || "Internal server error", 500);
  }
});
