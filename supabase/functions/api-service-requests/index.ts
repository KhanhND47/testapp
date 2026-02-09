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
    const path = url.pathname.replace(/^\/api-service-requests/, "") || "/";
    const method = req.method;

    if (path === "/" && method === "GET") {
      const { data, error } = await supabase
        .from("vr_service_requests")
        .select(
          `*, app_users:created_by (display_name), vehicle_repair_orders (ro_code, status, customers (name, phone), vehicles (license_plate, name)), vr_quotes (quote_code)`
        )
        .order("created_at", { ascending: false });
      if (error) return err(error.message);
      return json(data);
    }

    if (path === "/check-existing" && method === "GET") {
      const quoteId = url.searchParams.get("quote_id");
      if (!quoteId) return err("quote_id required");
      const { data, error } = await supabase
        .from("vr_service_requests")
        .select("*")
        .eq("quote_id", quoteId)
        .maybeSingle();
      if (error) return err(error.message);
      return json(data);
    }

    if (path === "/quote-items" && method === "GET") {
      const quoteId = url.searchParams.get("quote_id");
      if (!quoteId) return err("quote_id required");
      const { data, error } = await supabase
        .from("vr_quote_items")
        .select("*")
        .eq("quote_id", quoteId)
        .order("order_index");
      if (error) return err(error.message);
      return json(data);
    }

    if (path === "/" && method === "POST") {
      const {
        repairOrderId,
        quoteId,
        startTime,
        expectedFinishTime,
        totalAmount,
        items,
      } = await req.json();

      const { data: created, error: insertError } = await supabase
        .from("vr_service_requests")
        .insert([
          {
            repair_order_id: repairOrderId,
            quote_id: quoteId,
            start_time: startTime,
            expected_finish_time: expectedFinishTime,
            total_amount: totalAmount || 0,
            created_by: user.id,
            status: "sent",
          },
        ])
        .select()
        .single();
      if (insertError) return err(insertError.message);

      if (items && items.length > 0) {
        const itemsToInsert = items.map(
          (
            item: { item_type: string; description: string; qty: number },
            idx: number
          ) => ({
            service_request_id: created.id,
            item_type: item.item_type,
            description: item.description,
            qty: item.qty,
            sort_order: idx,
          })
        );
        const { error: itemsError } = await supabase
          .from("vr_service_request_items")
          .insert(itemsToInsert);
        if (itemsError) return err(itemsError.message);
      }

      await supabase
        .from("vehicle_repair_orders")
        .update({
          status: "SERVICE_REQUEST_SIGNED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", repairOrderId);

      return json(created, 201);
    }

    const detailMatch = path.match(/^\/([^/]+)$/);

    if (detailMatch && method === "GET") {
      const id = detailMatch[1];
      const { data, error } = await supabase
        .from("vr_service_requests")
        .select(
          `*, app_users:created_by (display_name), vehicle_repair_orders (ro_code, odo, fuel_level, customers (name, phone), vehicles (license_plate, name)), vr_quotes (quote_code, total_amount)`
        )
        .eq("id", id)
        .single();
      if (error) return err(error.message);

      let quoteItems: unknown[] = [];
      if (data.quote_id) {
        const { data: items } = await supabase
          .from("vr_quote_items")
          .select("*")
          .eq("quote_id", data.quote_id)
          .order("order_index", { ascending: true });
        quoteItems = items || [];
      }

      return json({ serviceRequest: data, quoteItems });
    }

    if (detailMatch && method === "PUT") {
      const id = detailMatch[1];
      const body = await req.json();
      const { error } = await supabase
        .from("vr_service_requests")
        .update(body)
        .eq("id", id);
      if (error) return err(error.message);
      return json({ success: true });
    }

    const createROMatch = path.match(/^\/([^/]+)\/create-repair-order$/);
    if (createROMatch && method === "POST") {
      const serviceRequestId = createROMatch[1];
      const { receiveDate, returnDate, repairItems, serviceRequest } =
        await req.json();

      const { data: lastOrder } = await supabase
        .from("general_repair_orders")
        .select("ro_code")
        .order("created_at", { ascending: false })
        .limit(1);

      let newRoCode = "AAA-00001";
      if (lastOrder && lastOrder.length > 0) {
        const lastCode = lastOrder[0].ro_code;
        const match = lastCode.match(/AAA-(\d+)/);
        if (match) {
          const nextNum = parseInt(match[1]) + 1;
          newRoCode = `AAA-${String(nextNum).padStart(5, "0")}`;
        }
      }

      const { data: newOrder, error: orderError } = await supabase
        .from("general_repair_orders")
        .insert({
          ro_code: newRoCode,
          license_plate: serviceRequest.licensePlate,
          vehicle_name: serviceRequest.vehicleName,
          customer_name: serviceRequest.customerName,
          customer_phone: serviceRequest.customerPhone,
          receive_date: receiveDate,
          return_date: returnDate,
          status: "pending",
        })
        .select()
        .single();
      if (orderError) return err(orderError.message);

      if (repairItems && repairItems.length > 0) {
        const itemsToInsert = repairItems.map(
          (
            item: {
              name: string;
              description: string;
              repair_type: string;
            },
            idx: number
          ) => ({
            order_id: newOrder.id,
            name: item.name,
            description: item.description || null,
            status: "pending",
            repair_type: item.repair_type || null,
            order_index: idx,
          })
        );
        const { error: itemsError } = await supabase
          .from("repair_items")
          .insert(itemsToInsert);
        if (itemsError) return err(itemsError.message);
      }

      await supabase
        .from("vr_service_requests")
        .update({
          status: "confirmed",
          general_repair_order_id: newOrder.id,
        })
        .eq("id", serviceRequestId);

      await supabase
        .from("vehicle_repair_orders")
        .update({
          status: "approved",
          updated_at: new Date().toISOString(),
        })
        .eq("id", serviceRequest.repairOrderId);

      return json({ orderId: newOrder.id, roCode: newRoCode }, 201);
    }

    return err("Not found", 404);
  } catch (e) {
    return err(e.message || "Internal server error", 500);
  }
});
