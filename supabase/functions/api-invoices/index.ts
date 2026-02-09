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
    const path = url.pathname.replace(/^\/api-invoices/, "") || "/";
    const method = req.method;

    if (path === "/" && method === "GET") {
      const { data: inspections, error } = await supabase
        .from("quality_inspections")
        .select("*")
        .eq("status", "completed")
        .eq("overall_result", "pass")
        .order("inspected_at", { ascending: false });
      if (error) return err(error.message);

      const orderIds = (inspections || []).map(
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
        for (const insp of inspections || []) {
          (insp as Record<string, unknown>).order = orderMap.get(
            insp.repair_order_id
          );
        }
      }

      return json(inspections);
    }

    const detailMatch = path.match(/^\/([^/]+)$/);
    if (detailMatch && method === "GET") {
      const orderId = detailMatch[1];

      const [orderRes, itemsRes, quoteRes, inspRes] = await Promise.all([
        supabase
          .from("general_repair_orders")
          .select("*")
          .eq("id", orderId)
          .maybeSingle(),
        supabase
          .from("repair_items")
          .select("*")
          .eq("order_id", orderId)
          .order("order_index"),
        supabase
          .from("vr_quotes")
          .select("*, vr_quote_items(*)")
          .eq("repair_order_id", orderId)
          .maybeSingle(),
        supabase
          .from("quality_inspections")
          .select("*, quality_inspection_items(*)")
          .eq("repair_order_id", orderId)
          .maybeSingle(),
      ]);

      return json({
        order: orderRes.data,
        items: itemsRes.data || [],
        quote: quoteRes.data,
        inspection: inspRes.data,
      });
    }

    if (path === "/handovers" && method === "POST") {
      const body = await req.json();
      const { data, error } = await supabase
        .from("acceptance_handovers")
        .insert([body])
        .select()
        .maybeSingle();
      if (error) return err(error.message);
      return json(data, 201);
    }

    const handoverMatch = path.match(/^\/handovers\/([^/]+)$/);
    if (handoverMatch && method === "GET") {
      const orderId = handoverMatch[1];
      const { data, error } = await supabase
        .from("acceptance_handovers")
        .select("*")
        .eq("repair_order_id", orderId)
        .maybeSingle();
      if (error) return err(error.message);
      return json(data);
    }

    return err("Not found", 404);
  } catch (e) {
    return err(e.message || "Internal server error", 500);
  }
});
