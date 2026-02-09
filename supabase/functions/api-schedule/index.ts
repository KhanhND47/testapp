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
    const path = url.pathname.replace(/^\/api-schedule/, "") || "/";
    const method = req.method;

    if (path === "/data" && method === "GET") {
      const { data: lifts } = await supabase
        .from("repair_lifts")
        .select("*")
        .eq("is_active", true)
        .order("position");

      const { data: itemsData } = await supabase
        .from("repair_items")
        .select("order_id")
        .eq("repair_type", "sua_chua")
        .neq("status", "completed");

      const repairOrderIds = [
        ...new Set((itemsData || []).map((i: { order_id: string }) => i.order_id)),
      ];

      if (repairOrderIds.length === 0) {
        const { data: appointments } = await supabase
          .from("appointments")
          .select("*")
          .eq("status", "pending")
          .order("appointment_date", { ascending: true });

        return json({
          lifts: lifts || [],
          assignments: [],
          unassignedOrders: [],
          appointments: appointments || [],
        });
      }

      const { data: ordersData } = await supabase
        .from("general_repair_orders")
        .select(
          "id, license_plate, customer_name, vehicle_name, receive_date, return_date, waiting_for_parts, parts_note, parts_order_start_time, parts_expected_end_time"
        )
        .in("id", repairOrderIds)
        .neq("status", "completed");

      const activeOrderIds = (ordersData || []).map(
        (o: { id: string }) => o.id
      );

      const [assignmentRes, workersRes, appointmentsRes] = await Promise.all([
        supabase
          .from("lift_assignments")
          .select("*")
          .in("repair_order_id", activeOrderIds),
        supabase
          .from("repair_items")
          .select(
            `id, order_id, status, repair_item_assigned_workers!inner(worker_id, repair_workers!inner(id, name, worker_type))`
          )
          .eq("status", "in_progress")
          .eq("repair_type", "sua_chua")
          .in("order_id", activeOrderIds),
        supabase
          .from("appointments")
          .select("*")
          .eq("status", "pending")
          .order("appointment_date", { ascending: true }),
      ]);

      const activeWorkersMap: Record<
        string,
        Array<{ id: string; name: string; worker_type: string }>
      > = {};
      if (workersRes.data) {
        for (const item of workersRes.data as any[]) {
          if (
            item.repair_item_assigned_workers &&
            Array.isArray(item.repair_item_assigned_workers)
          ) {
            for (const assignment of item.repair_item_assigned_workers) {
              if (assignment.repair_workers) {
                const workers = activeWorkersMap[item.order_id] || [];
                if (
                  !workers.some(
                    (w: { id: string }) =>
                      w.id === assignment.repair_workers.id
                  )
                ) {
                  workers.push({
                    id: assignment.repair_workers.id,
                    name: assignment.repair_workers.name,
                    worker_type: assignment.repair_workers.worker_type,
                  });
                  activeWorkersMap[item.order_id] = workers;
                }
              }
            }
          }
        }
      }

      const assignmentMap = new Map(
        (assignmentRes.data || []).map((a: any) => [a.repair_order_id, a])
      );

      const withLift: any[] = [];
      const withoutLift: any[] = [];

      for (const order of ordersData || []) {
        const assignment = assignmentMap.get(order.id);
        const activeWorkers = activeWorkersMap[order.id] || [];
        if (assignment && assignment.lift_id) {
          withLift.push({ ...assignment, order, activeWorkers });
        } else {
          withoutLift.push({ ...order, activeWorkers });
        }
      }

      return json({
        lifts: lifts || [],
        assignments: withLift,
        unassignedOrders: withoutLift,
        appointments: appointmentsRes.data || [],
      });
    }

    if (path === "/assignments" && method === "POST") {
      const { repair_order_id, lift_id, scheduled_start, scheduled_end } =
        await req.json();

      const { data: existing } = await supabase
        .from("lift_assignments")
        .select("id")
        .eq("repair_order_id", repair_order_id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("lift_assignments")
          .update({
            lift_id,
            scheduled_start,
            scheduled_end,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) return err(error.message);
      } else {
        const { error } = await supabase.from("lift_assignments").insert({
          repair_order_id,
          lift_id,
          scheduled_start,
          scheduled_end,
        });
        if (error) return err(error.message);
      }

      return json({ success: true });
    }

    const assignmentMatch = path.match(/^\/assignments\/([^/]+)$/);
    if (assignmentMatch && method === "PUT") {
      const id = assignmentMatch[1];
      const body = await req.json();
      const { error } = await supabase
        .from("lift_assignments")
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return err(error.message);
      return json({ success: true });
    }

    const removeMatch = path.match(/^\/assignments\/([^/]+)\/remove$/);
    if (removeMatch && method === "PUT") {
      const id = removeMatch[1];
      const { error } = await supabase
        .from("lift_assignments")
        .update({
          lift_id: null,
          scheduled_start: null,
          scheduled_end: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) return err(error.message);
      return json({ success: true });
    }

    const partsMatch = path.match(/^\/assignments\/([^/]+)\/parts-wait$/);
    if (partsMatch && method === "PUT") {
      const id = partsMatch[1];
      const body = await req.json();
      const { error } = await supabase
        .from("lift_assignments")
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
