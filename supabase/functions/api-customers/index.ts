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
    const path = url.pathname.replace(/^\/api-customers/, "") || "/";
    const method = req.method;

    if (path === "/" && method === "GET") {
      const { data, error } = await supabase
        .from("customers")
        .select("*, vehicles(id)")
        .order("created_at", { ascending: false });
      if (error) return err(error.message);
      return json(data);
    }

    if (path === "/search-plate" && method === "GET") {
      const plate = url.searchParams.get("plate") || "";
      const { data, error } = await supabase
        .from("vehicles")
        .select("customer_id")
        .ilike("license_plate", `%${plate}%`);
      if (error) return err(error.message);
      return json(data);
    }

    const detailMatch = path.match(/^\/([^/]+)$/);
    if (detailMatch && method === "GET") {
      const customerId = detailMatch[1];
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .maybeSingle();
      if (error) return err(error.message);
      return json(data);
    }

    const vehiclesMatch = path.match(/^\/([^/]+)\/vehicles$/);
    if (vehiclesMatch && method === "GET") {
      const customerId = vehiclesMatch[1];
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });
      if (error) return err(error.message);
      return json(data);
    }

    const ordersMatch = path.match(/^\/([^/]+)\/orders$/);
    if (ordersMatch && method === "GET") {
      const customerId = ordersMatch[1];
      const vehicleId = url.searchParams.get("vehicle_id");

      if (vehicleId) {
        const [vrOrders, grOrders] = await Promise.all([
          supabase
            .from("vehicle_repair_orders")
            .select("*")
            .eq("customer_id", customerId)
            .eq("vehicle_id", vehicleId)
            .order("created_at", { ascending: false }),
          supabase
            .from("general_repair_orders")
            .select("*")
            .eq("customer_phone", customerId)
            .order("created_at", { ascending: false }),
        ]);
        return json({
          vehicleRepairOrders: vrOrders.data || [],
          generalRepairOrders: grOrders.data || [],
        });
      }

      const { data } = await supabase
        .from("vehicle_repair_orders")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });
      return json(data || []);
    }

    return err("Not found", 404);
  } catch (e) {
    return err(e.message || "Internal server error", 500);
  }
});
