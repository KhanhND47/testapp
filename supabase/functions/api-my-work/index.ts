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

function isMissingAssignedWorkersTable(error: { message?: string } | null | undefined) {
  const message = error?.message || "";
  return (
    message.includes("repair_item_assigned_workers") &&
    (message.includes("does not exist") || message.includes("schema cache"))
  );
}

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
      worker_id: (payload.worker_id as string) || null,
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
    const path = url.pathname.replace(/^\/api-my-work/, "") || "/";
    const method = req.method;

    if (path === "/" && method === "GET") {
      const workerId =
        url.searchParams.get("worker_id") || user.worker_id;
      if (!workerId) return err("No worker_id");

      const [assignedRes, workerRes] = await Promise.all([
        supabase
          .from("repair_item_assigned_workers")
          .select("repair_item_id")
          .eq("worker_id", workerId),
        supabase
          .from("repair_items")
          .select("*")
          .eq("worker_id", workerId),
      ]);

      if (workerRes.error) return err(workerRes.error.message);
      if (
        assignedRes.error &&
        !isMissingAssignedWorkersTable(assignedRes.error)
      ) {
        return err(assignedRes.error.message);
      }

      const assignedItemIds =
        assignedRes.data?.map(
          (a: { repair_item_id: string }) => a.repair_item_id
        ) || [];
      const workerItemIds =
        workerRes.data?.map((i: { id: string }) => i.id) || [];
      const allItemIds = [...new Set([...assignedItemIds, ...workerItemIds])];

      if (allItemIds.length === 0) {
        return json({ pending: [], inProgress: [], completed: [] });
      }

      const { data: items, error: itemsErr } = await supabase
        .from("repair_items")
        .select("*")
        .in("id", allItemIds)
        .order("started_at", { ascending: false });
      if (itemsErr) return err(itemsErr.message);

      if (!items) return json({ pending: [], inProgress: [], completed: [] });

      const orderIds = [...new Set(items.map((i: any) => i.order_id))];
      const itemIds = items.map((i: any) => i.id);

      const [ordersRes, imagesRes] = await Promise.all([
        supabase
          .from("general_repair_orders")
          .select("*")
          .in("id", orderIds),
        supabase
          .from("repair_item_images")
          .select("*")
          .in("repair_item_id", itemIds)
          .order("captured_at"),
      ]);
      if (ordersRes.error) return err(ordersRes.error.message);
      if (imagesRes.error) return err(imagesRes.error.message);

      const itemsWithData = items.map((item: any) => ({
        ...item,
        order: ordersRes.data?.find((o: any) => o.id === item.order_id),
        images:
          imagesRes.data?.filter(
            (img: any) => img.repair_item_id === item.id
          ) || [],
      }));

      return json({
        pending: itemsWithData.filter(
          (i: any) => i.status === "pending"
        ),
        inProgress: itemsWithData.filter(
          (i: any) => i.status === "in_progress"
        ),
        completed: itemsWithData.filter(
          (i: any) => i.status === "completed"
        ),
      });
    }

    const completeMatch = path.match(/^\/items\/([^/]+)\/complete$/);
    if (completeMatch && method === "POST") {
      const itemId = completeMatch[1];
      const body = await req.json();
      const imageData = body.imageData ?? body.image_data ?? body.image;
      const orderId = body.orderId ?? body.order_id;
      const workerId = body.workerId ?? body.worker_id ?? user.worker_id;

      if (imageData) {
        const { error: imgErr } = await supabase.from("repair_item_images").insert([
          {
            repair_item_id: itemId,
            image_data: imageData,
            image_type: "complete",
            captured_at: new Date().toISOString(),
          },
        ]);
        if (imgErr) return err(imgErr.message);
      }

      const updatePayload: Record<string, unknown> = {
        status: "completed",
        completed_at: new Date().toISOString(),
      };
      if (workerId) {
        updatePayload.worker_id = workerId;
      }
      const { error: itemErr } = await supabase
        .from("repair_items")
        .update(updatePayload)
        .eq("id", itemId);
      if (itemErr) return err(itemErr.message);

      if (orderId) {
        const { data: remaining } = await supabase
          .from("repair_items")
          .select("status")
          .eq("order_id", orderId)
          .neq("status", "completed");

        if (!remaining || remaining.length === 0) {
          const { error: orderErr } = await supabase
            .from("general_repair_orders")
            .update({
              status: "completed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);
          if (orderErr) return err(orderErr.message);
        }
      }

      return json({ success: true });
    }

    return err("Not found", 404);
  } catch (e) {
    return err(e.message || "Internal server error", 500);
  }
});
