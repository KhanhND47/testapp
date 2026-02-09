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
const VIETNAM_TIMEZONE = "Asia/Ho_Chi_Minh";

function isMissingAssignedWorkersTable(error: { message?: string } | null | undefined) {
  const message = error?.message || "";
  return (
    message.includes("repair_item_assigned_workers") &&
    (message.includes("does not exist") || message.includes("schema cache"))
  );
}

function isMissingEstimatedDurationColumn(error: { message?: string } | null | undefined) {
  const message = error?.message || "";
  return (
    message.includes("estimated_duration_minutes") &&
    (message.includes("column") || message.includes("schema cache"))
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

function getVietnamDayKey(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: VIETNAM_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function canPrioritizeItem(
  role: string,
  repairType: string | null | undefined
) {
  if (role === "admin") return true;
  if (role === "paint_lead" && repairType === "dong_son") return true;
  if (role === "worker_lead" && repairType === "sua_chua") return true;
  return false;
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
    const path = url.pathname.replace(/^\/api-repairs/, "") || "/";
    const method = req.method;

    // GET / - List orders with progress
    if (path === "/" && method === "GET") {
      const offset = parseInt(url.searchParams.get("offset") || "0");
      const limit = parseInt(url.searchParams.get("limit") || "10");

      const isAdmin = user.role === "admin";
      const isPaintLead = user.role === "paint_lead";
      const isWorkerLead = user.role === "worker_lead";
      const isLead = isPaintLead || isWorkerLead;
      const shouldFilter = !!user.worker_id && !isAdmin && !isLead;

      let ordersData: any[];

      if (shouldFilter) {
        const [assignedRes, workerRes] = await Promise.all([
          supabase
            .from("repair_item_assigned_workers")
            .select("repair_item_id")
            .eq("worker_id", user.worker_id),
          supabase
            .from("repair_items")
            .select("order_id")
            .eq("worker_id", user.worker_id),
        ]);

        const assignedItemIds =
          assignedRes.data?.map((a: any) => a.repair_item_id) || [];
        let orderIds =
          workerRes.data?.map((item: any) => item.order_id) || [];

        if (assignedItemIds.length > 0) {
          const { data: items } = await supabase
            .from("repair_items")
            .select("order_id")
            .in("id", assignedItemIds);
          const extra = items?.map((i: any) => i.order_id) || [];
          orderIds = [...orderIds, ...extra];
        }

        const uniqueIds = [...new Set(orderIds)];
        if (uniqueIds.length === 0) return json({ orders: [], hasMore: false });

        const { data } = await supabase
          .from("general_repair_orders")
          .select("*")
          .in("id", uniqueIds)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);
        ordersData = data || [];
      } else {
        const { data } = await supabase
          .from("general_repair_orders")
          .select("*")
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);
        ordersData = data || [];
      }

      const result = [];
      for (const order of ordersData) {
        const { data: items } = await supabase
          .from("repair_items")
          .select("status, parent_id, repair_type")
          .eq("order_id", order.id);
        const allItems = items || [];

        if (isPaintLead && !allItems.some((i: any) => i.repair_type === "dong_son")) continue;
        if (isWorkerLead && !allItems.some((i: any) => i.repair_type === "sua_chua")) continue;

        const childItems = allItems.filter((i: any) => i.parent_id !== null);
        const parentOnly = allItems.filter((i: any) => i.parent_id === null);
        const parentsWithChildren = new Set(childItems.map((i: any) => i.parent_id));
        const leafItems = childItems.length > 0
          ? childItems
          : parentOnly.filter((i: any) => !parentsWithChildren.has(i.id));

        const totalItems = leafItems.length;
        const completedItems = leafItems.filter((i: any) => i.status === "completed").length;
        const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        result.push({ ...order, totalItems, completedItems, progress });
      }

      return json({ orders: result, hasMore: ordersData.length === limit });
    }

    // GET /workers
    if (path === "/workers" && method === "GET") {
      const { data } = await supabase
        .from("repair_workers")
        .select("*")
        .eq("is_active", true)
        .order("name");
      return json(data || []);
    }

    // POST /server-time
    if (path === "/server-time" && method === "POST") {
      const { data } = await supabase.rpc("get_server_time");
      return json({ time: data });
    }

    // POST / - Create order
    if (path === "/" && method === "POST") {
      const { order, items } = await req.json();
      const { data: created, error: oErr } = await supabase
        .from("general_repair_orders")
        .insert([{ ...order, status: "pending" }])
        .select("id")
        .maybeSingle();
      if (oErr || !created) return err(oErr?.message || "Failed to create order");

      const parentItems = items.map((item: any, idx: number) => ({
        order_id: created.id,
        name: item.name,
        status: "pending",
        order_index: idx,
        repair_type: item.repairType || null,
        parent_id: null,
      }));

      const { data: inserted, error: pErr } = await supabase
        .from("repair_items")
        .insert(parentItems)
        .select("id, name");
      if (pErr) return err(pErr.message);

      const subItemsData: any[] = [];
      items.forEach((item: any) => {
        if (item.subItems?.length > 0) {
          const parent = inserted?.find((p: any) => p.name === item.name);
          if (parent) {
            item.subItems.forEach((sub: any, idx: number) => {
              subItemsData.push({
                order_id: created.id,
                name: sub.name,
                status: "pending",
                order_index: idx,
                parent_id: parent.id,
              });
            });
          }
        }
      });

      if (subItemsData.length > 0) {
        const { error: sErr } = await supabase.from("repair_items").insert(subItemsData);
        if (sErr) return err(sErr.message);
      }

      return json({ id: created.id }, 201);
    }

    // Routes with order ID
    const orderMatch = path.match(/^\/([^/]+)$/);
    const detailMatch = path.match(/^\/([^/]+)\/detail$/);
    const itemsMatch = path.match(/^\/([^/]+)\/items$/);
    const partsMatch = path.match(/^\/([^/]+)\/parts-waiting$/);
    const slipsListMatch = path.match(/^\/([^/]+)\/supplementary-slips$/);
    const quotesListMatch = path.match(/^\/([^/]+)\/supplementary-quotes$/);

    // GET /:id/detail - Full detail for modal
    if (detailMatch && method === "GET") {
      const orderId = detailMatch[1];
      const [orderRes, workersRes, timeRes] = await Promise.all([
        supabase.from("general_repair_orders").select("*").eq("id", orderId).maybeSingle(),
        supabase.from("repair_workers").select("*").eq("is_active", true).order("name"),
        supabase.rpc("get_server_time"),
      ]);

      const { data: allItems } = await supabase
        .from("repair_items")
        .select("*")
        .eq("order_id", orderId)
        .order("order_index");

      let filteredItems = allItems || [];
      const isNonLeadWorker = (user.role === "worker" || user.role === "paint") && user.worker_id;
      if (isNonLeadWorker) {
        const { data: assigned } = await supabase
          .from("repair_item_assigned_workers")
          .select("repair_item_id")
          .eq("worker_id", user.worker_id);
        const assignedIds = new Set(assigned?.map((a: any) => a.repair_item_id) || []);
        const myItems = filteredItems.filter(
          (i: any) => i.worker_id === user.worker_id || assignedIds.has(i.id)
        );
        const childParentIds = new Set(
          myItems.filter((i: any) => i.parent_id).map((i: any) => i.parent_id)
        );
        const myIds = new Set(myItems.map((i: any) => i.id));
        const parents = filteredItems.filter(
          (p: any) => childParentIds.has(p.id) && !myIds.has(p.id)
        );
        filteredItems = [...myItems, ...parents];
      }

      let itemsWithData: any[] = [];
      if (filteredItems.length > 0) {
        const ids = filteredItems.map((i: any) => i.id);
        const [imagesRes, awRes, trRes] = await Promise.all([
          supabase.from("repair_item_images").select("*").in("repair_item_id", ids).order("captured_at"),
          supabase.from("repair_item_assigned_workers").select("*").in("repair_item_id", ids),
          supabase.from("repair_item_transfers").select("*").in("repair_item_id", ids).order("transferred_at"),
        ]);

        const ws = workersRes.data || [];
        const todayKey = getVietnamDayKey(new Date());
        itemsWithData = filteredItems.map((item: any) => {
          const assignmentRows = (awRes.data || []).filter(
            (aw: any) => aw.repair_item_id === item.id
          );
          const awIds = assignmentRows.map((aw: any) => aw.worker_id);
          if (awIds.length === 0 && item.worker_id) {
            awIds.push(item.worker_id);
          }

          const priorityMarkedAtCandidates = assignmentRows
            .map((aw: any) => aw.priority_marked_at)
            .filter(Boolean);
          const latestPriorityMarkedAt = priorityMarkedAtCandidates.sort().pop() || null;
          const isPriorityToday = assignmentRows.some((aw: any) => {
            if (!aw.priority_marked_at) return false;
            return (
              getVietnamDayKey(new Date(aw.priority_marked_at)) === todayKey
            );
          });

          return {
            ...item,
            worker: ws.find((w: any) => w.id === item.worker_id) || null,
            images: (imagesRes.data || []).filter((img: any) => img.repair_item_id === item.id),
            assignedWorkers: ws.filter((w: any) => awIds.includes(w.id)),
            priority_marked_at: latestPriorityMarkedAt,
            is_priority_today: isPriorityToday,
            transfers: (trRes.data || [])
              .filter((t: any) => t.repair_item_id === item.id)
              .map((t: any) => ({
                ...t,
                fromWorker: ws.find((w: any) => w.id === t.from_worker_id),
                toWorker: ws.find((w: any) => w.id === t.to_worker_id),
              })),
          };
        });
      }

      return json({
        order: orderRes.data,
        workers: workersRes.data || [],
        serverTime: timeRes.data,
        items: itemsWithData,
      });
    }

    // PUT /:id - Update order
    if (orderMatch && method === "PUT") {
      const orderId = orderMatch[1];
      const body = await req.json();
      const { error: uErr } = await supabase
        .from("general_repair_orders")
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq("id", orderId);
      if (uErr) return err(uErr.message);
      return json({ success: true });
    }

    // DELETE /:id - Delete order
    if (orderMatch && method === "DELETE") {
      if (user.role !== "admin") return err("Forbidden", 403);
      const orderId = orderMatch[1];
      await supabase.from("repair_items").delete().eq("order_id", orderId);
      await supabase.from("general_repair_orders").delete().eq("id", orderId);
      return json({ success: true });
    }

    // POST /:id/items - Add items
    if (itemsMatch && method === "POST") {
      const orderId = itemsMatch[1];
      const { items } = await req.json();
      const data = items.map((item: any, idx: number) => ({
        ...item,
        order_id: orderId,
        order_index: idx,
        status: "pending",
      }));
      const { error: iErr } = await supabase.from("repair_items").insert(data);
      if (iErr) return err(iErr.message);
      return json({ success: true }, 201);
    }

    // PUT /:id/parts-waiting
    if (partsMatch && method === "PUT") {
      const orderId = partsMatch[1];
      const body = await req.json();
      const {
        parts_wait_start,
        parts_wait_end,
        ...rest
      } = body as {
        parts_wait_start?: string | null;
        parts_wait_end?: string | null;
        [key: string]: unknown;
      };

      const updatePayload: Record<string, unknown> = {
        ...rest,
        updated_at: new Date().toISOString(),
      };

      if (parts_wait_start !== undefined) {
        updatePayload.parts_order_start_time = parts_wait_start;
      }
      if (parts_wait_end !== undefined) {
        updatePayload.parts_expected_end_time = parts_wait_end;
      }

      const { error: pErr } = await supabase
        .from("general_repair_orders")
        .update(updatePayload)
        .eq("id", orderId);
      if (pErr) return err(pErr.message);
      return json({ success: true });
    }

    // Item-level routes
    const itemMatch = path.match(/^\/items\/([^/]+)$/);
    const startMatch = path.match(/^\/items\/([^/]+)\/start$/);
    const priorityTodayMatch = path.match(/^\/items\/([^/]+)\/priority-today$/);
    const completeMatch = path.match(/^\/items\/([^/]+)\/complete$/);
    const workerAddMatch = path.match(/^\/items\/([^/]+)\/workers$/);
    const workerRemoveMatch = path.match(/^\/items\/([^/]+)\/workers\/([^/]+)$/);
    const transferMatch = path.match(/^\/items\/([^/]+)\/transfer$/);
    const imageAddMatch = path.match(/^\/items\/([^/]+)\/images$/);

    // PUT /items/:id
    if (itemMatch && method === "PUT") {
      const itemId = itemMatch[1];
      const body = await req.json();
      const { error: iErr } = await supabase.from("repair_items").update(body).eq("id", itemId);
      if (iErr) return err(iErr.message);
      return json({ success: true });
    }

    // DELETE /items/:id
    if (itemMatch && method === "DELETE") {
      const itemId = itemMatch[1];
      await supabase.from("repair_items").delete().eq("parent_id", itemId);
      await supabase.from("repair_items").delete().eq("id", itemId);
      return json({ success: true });
    }

    // POST /items/:id/start
    if (startMatch && method === "POST") {
      const itemId = startMatch[1];
      const body = await req.json();
      const imageData = body.imageData ?? body.image_data ?? body.image;
      const parentId = body.parentId ?? body.parent_id;
      const orderId = body.orderId ?? body.order_id;
      const workerId = body.workerId ?? body.worker_id;
      const nowIso = new Date().toISOString();

      if (imageData) {
        const { error: imgErr } = await supabase.from("repair_item_images").insert([{
          repair_item_id: itemId,
          image_data: imageData,
          image_type: "start",
          captured_at: nowIso,
        }]);
        if (imgErr) return err(imgErr.message);
      }

      const itemUpdatePayload: Record<string, unknown> = {
        status: "in_progress",
        started_at: nowIso,
      };
      if (workerId) itemUpdatePayload.worker_id = workerId;
      const { error: startErr } = await supabase
        .from("repair_items")
        .update(itemUpdatePayload)
      .eq("id", itemId);
      if (startErr) return err(startErr.message);

      if (workerId) {
        const { data: engagedRows, error: engagedErr } = await supabase
          .from("repair_item_assigned_workers")
          .update({
            workload_engaged_at: nowIso,
            workload_engaged_by: "start",
          })
          .eq("repair_item_id", itemId)
          .eq("worker_id", workerId)
          .is("workload_engaged_at", null)
          .select("id");
        if (engagedErr && !isMissingAssignedWorkersTable(engagedErr)) {
          return err(engagedErr.message);
        }

        if ((engagedRows || []).length === 0) {
          const { error: assignErr } = await supabase
            .from("repair_item_assigned_workers")
            .insert([
              {
                repair_item_id: itemId,
                worker_id: workerId,
                workload_engaged_at: nowIso,
                workload_engaged_by: "start",
              },
            ]);
          const isDuplicate = (assignErr as any)?.code === "23505";
          if (
            assignErr &&
            !isDuplicate &&
            !isMissingAssignedWorkersTable(assignErr)
          ) {
            return err(assignErr.message);
          }

          if (isDuplicate) {
            const { error: updateDupErr } = await supabase
              .from("repair_item_assigned_workers")
              .update({
                workload_engaged_at: nowIso,
                workload_engaged_by: "start",
              })
              .eq("repair_item_id", itemId)
              .eq("worker_id", workerId)
              .is("workload_engaged_at", null);
            if (
              updateDupErr &&
              !isMissingAssignedWorkersTable(updateDupErr)
            ) {
              return err(updateDupErr.message);
            }
          }
        }
      }

      if (parentId) {
        const { error: parentErr } = await supabase
          .from("repair_items")
          .update({ status: "in_progress" })
          .eq("id", parentId);
        if (parentErr) return err(parentErr.message);
      }

      if (orderId) {
        const { error: orderErr } = await supabase
          .from("general_repair_orders")
          .update({
            status: "in_progress",
            updated_at: nowIso,
          })
          .eq("id", orderId);
        if (orderErr) return err(orderErr.message);
      }

      return json({ success: true });
    }

    // POST /items/:id/priority-today
    if (priorityTodayMatch && method === "POST") {
      const itemId = priorityTodayMatch[1];
      const nowIso = new Date().toISOString();

      const { data: item, error: itemErr } = await supabase
        .from("repair_items")
        .select("id, status, repair_type")
        .eq("id", itemId)
        .maybeSingle();
      if (itemErr) return err(itemErr.message);
      if (!item) return err("Repair item not found", 404);
      if (item.status !== "pending") {
        return err("Only pending items can be marked as priority today");
      }
      if (!canPrioritizeItem(user.role, item.repair_type)) {
        return err("Forbidden", 403);
      }

      const { data: assignedRows, error: assignedErr } = await supabase
        .from("repair_item_assigned_workers")
        .select("id, worker_id")
        .eq("repair_item_id", itemId);
      if (assignedErr && !isMissingAssignedWorkersTable(assignedErr)) {
        return err(assignedErr.message);
      }
      if (!assignedRows || assignedRows.length === 0) {
        return err("Item has no assigned workers");
      }

      const { error: priorityErr } = await supabase
        .from("repair_item_assigned_workers")
        .update({
          priority_marked_at: nowIso,
        })
        .eq("repair_item_id", itemId);
      if (priorityErr && !isMissingAssignedWorkersTable(priorityErr)) {
        return err(priorityErr.message);
      }

      const { error: engageErr } = await supabase
        .from("repair_item_assigned_workers")
        .update({
          workload_engaged_at: nowIso,
          workload_engaged_by: "priority",
        })
        .eq("repair_item_id", itemId)
        .is("workload_engaged_at", null);
      if (engageErr && !isMissingAssignedWorkersTable(engageErr)) {
        return err(engageErr.message);
      }

      return json({ success: true, priority_marked_at: nowIso });
    }

    // POST /items/:id/complete
    if (completeMatch && method === "POST") {
      const itemId = completeMatch[1];
      const body = await req.json();
      const imageData = body.imageData ?? body.image_data ?? body.image;
      const parentId = body.parentId ?? body.parent_id;
      const orderId = body.orderId ?? body.order_id;
      const workerId = body.workerId ?? body.worker_id;

      if (imageData) {
        const { error: imgErr } = await supabase.from("repair_item_images").insert([{
          repair_item_id: itemId,
          image_data: imageData,
          image_type: "complete",
          captured_at: new Date().toISOString(),
        }]);
        if (imgErr) return err(imgErr.message);
      }

      const completeUpdatePayload: Record<string, unknown> = {
        status: "completed",
        completed_at: new Date().toISOString(),
      };
      if (workerId) completeUpdatePayload.worker_id = workerId;
      const { error: completeErr } = await supabase
        .from("repair_items")
        .update(completeUpdatePayload)
        .eq("id", itemId);
      if (completeErr) return err(completeErr.message);

      if (parentId) {
        const { data: siblings } = await supabase
          .from("repair_items")
          .select("status")
          .eq("parent_id", parentId)
          .neq("status", "completed");
        if (!siblings || siblings.length === 0) {
          const { error: parentCompleteErr } = await supabase
            .from("repair_items")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
            })
            .eq("id", parentId);
          if (parentCompleteErr) return err(parentCompleteErr.message);
        }
      }

      if (orderId) {
        const { data: remaining } = await supabase
          .from("repair_items")
          .select("status, parent_id")
          .eq("order_id", orderId)
          .is("parent_id", null)
          .neq("status", "completed");
        if (!remaining || remaining.length === 0) {
          const { error: orderCompleteErr } = await supabase
            .from("general_repair_orders")
            .update({
              status: "completed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);
          if (orderCompleteErr) return err(orderCompleteErr.message);
        }
      }

      return json({ success: true });
    }

    // POST /items/:id/workers
    if (workerAddMatch && method === "POST") {
      const itemId = workerAddMatch[1];
      const body = await req.json();
      const workerId = body.workerId ?? body.worker_id;
      const estimatedDurationRaw =
        body.estimatedDurationMinutes ?? body.estimated_duration_minutes;

      if (!workerId) return err("Missing worker_id");

      let estimatedDurationMinutes: number | null = null;
      if (
        estimatedDurationRaw !== undefined &&
        estimatedDurationRaw !== null &&
        estimatedDurationRaw !== ""
      ) {
        estimatedDurationMinutes = Number(estimatedDurationRaw);
        if (
          !Number.isFinite(estimatedDurationMinutes) ||
          estimatedDurationMinutes <= 0
        ) {
          return err("Invalid estimated_duration_minutes");
        }
      }

      const { data: currentItem, error: itemErr } = await supabase
        .from("repair_items")
        .select("id, worker_id")
        .eq("id", itemId)
        .maybeSingle();
      if (itemErr) return err(itemErr.message);
      if (!currentItem) return err("Repair item not found", 404);

      const todayKey = getVietnamDayKey(new Date());
      const { data: itemAssignmentRows, error: itemAssignmentErr } = await supabase
        .from("repair_item_assigned_workers")
        .select("priority_marked_at")
        .eq("repair_item_id", itemId)
        .not("priority_marked_at", "is", null);
      if (
        itemAssignmentErr &&
        !isMissingAssignedWorkersTable(itemAssignmentErr)
      ) {
        return err(itemAssignmentErr.message);
      }

      const todayPriorityMarkedAt = (itemAssignmentRows || [])
        .map((row: any) => row.priority_marked_at)
        .filter((value: string | null | undefined) => {
          if (!value) return false;
          return getVietnamDayKey(new Date(value)) === todayKey;
        })
        .sort()
        .pop() || null;

      const { error: assignErr } = await supabase
        .from("repair_item_assigned_workers")
        .insert([{
          repair_item_id: itemId,
          worker_id: workerId,
          priority_marked_at: todayPriorityMarkedAt,
          workload_engaged_at: todayPriorityMarkedAt,
          workload_engaged_by: todayPriorityMarkedAt ? "priority" : null,
        }]);

      const isDuplicateAssignment = (assignErr as any)?.code === "23505";
      if (
        assignErr &&
        !isDuplicateAssignment &&
        !isMissingAssignedWorkersTable(assignErr)
      ) {
        return err(assignErr.message);
      }

      if (isDuplicateAssignment && todayPriorityMarkedAt) {
        const { error: duplicatePriorityErr } = await supabase
          .from("repair_item_assigned_workers")
          .update({
            priority_marked_at: todayPriorityMarkedAt,
            workload_engaged_at: todayPriorityMarkedAt,
            workload_engaged_by: "priority",
          })
          .eq("repair_item_id", itemId)
          .eq("worker_id", workerId)
          .is("workload_engaged_at", null);
        if (
          duplicatePriorityErr &&
          !isMissingAssignedWorkersTable(duplicatePriorityErr)
        ) {
          return err(duplicatePriorityErr.message);
        }
      }

      if (!currentItem.worker_id) {
        const { error: workerUpdateErr } = await supabase
          .from("repair_items")
          .update({ worker_id: workerId })
          .eq("id", itemId);
        if (workerUpdateErr) return err(workerUpdateErr.message);
      }

      if (estimatedDurationMinutes !== null) {
        const { error: estimateErr } = await supabase
          .from("repair_items")
          .update({ estimated_duration_minutes: Math.round(estimatedDurationMinutes) })
          .eq("id", itemId);
        if (
          estimateErr &&
          !isMissingEstimatedDurationColumn(estimateErr)
        ) {
          return err(estimateErr.message);
        }
      }

      return json({ success: true });
    }

    // DELETE /items/:id/workers/:workerId
    if (workerRemoveMatch && method === "DELETE") {
      const itemId = workerRemoveMatch[1];
      const workerId = workerRemoveMatch[2];
      const { error: deleteErr } = await supabase
        .from("repair_item_assigned_workers")
        .delete()
        .eq("repair_item_id", itemId)
        .eq("worker_id", workerId);
      if (deleteErr && !isMissingAssignedWorkersTable(deleteErr)) {
        return err(deleteErr.message);
      }

      const { error: clearErr } = await supabase
        .from("repair_items")
        .update({ worker_id: null })
        .eq("id", itemId)
        .eq("worker_id", workerId);
      if (clearErr) return err(clearErr.message);

      return json({ success: true });
    }

    // POST /items/:id/transfer
    if (transferMatch && method === "POST") {
      const itemId = transferMatch[1];
      const body = await req.json();
      const fromWorkerId = body.fromWorkerId ?? body.from_worker_id;
      const toWorkerId = body.toWorkerId ?? body.to_worker_id;
      if (!fromWorkerId || !toWorkerId) {
        return err("Missing from_worker_id or to_worker_id");
      }

      const { error: transferErr } = await supabase
        .from("repair_item_transfers")
        .insert([{
          repair_item_id: itemId,
          from_worker_id: fromWorkerId,
          to_worker_id: toWorkerId,
          transferred_at: new Date().toISOString(),
        }]);
      if (transferErr) return err(transferErr.message);

      const { error: removeErr } = await supabase
        .from("repair_item_assigned_workers")
        .delete()
        .eq("repair_item_id", itemId)
        .eq("worker_id", fromWorkerId);
      if (removeErr && !isMissingAssignedWorkersTable(removeErr)) {
        return err(removeErr.message);
      }

      const { data: existing, error: existingErr } = await supabase
        .from("repair_item_assigned_workers")
        .select("id")
        .eq("repair_item_id", itemId)
        .eq("worker_id", toWorkerId)
        .maybeSingle();
      if (existingErr && !isMissingAssignedWorkersTable(existingErr)) {
        return err(existingErr.message);
      }

      if (!existing) {
        const { error: assignErr } = await supabase
          .from("repair_item_assigned_workers")
          .insert([{
            repair_item_id: itemId,
            worker_id: toWorkerId,
          }]);
        if (assignErr && !isMissingAssignedWorkersTable(assignErr)) {
          return err(assignErr.message);
        }
      }

      const { error: itemUpdateErr } = await supabase
        .from("repair_items")
        .update({ worker_id: toWorkerId })
        .eq("id", itemId);
      if (itemUpdateErr) return err(itemUpdateErr.message);

      return json({ success: true });
    }

    // POST /items/:id/images
    if (imageAddMatch && method === "POST") {
      const itemId = imageAddMatch[1];
      const body = await req.json();
      await supabase.from("repair_item_images").insert([{
        repair_item_id: itemId,
        ...body,
        captured_at: new Date().toISOString(),
      }]);
      return json({ success: true });
    }

    // Supplementary slips
    if (slipsListMatch && method === "GET") {
      const orderId = slipsListMatch[1];
      const { data } = await supabase
        .from("supplementary_repair_slips")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });
      return json(data || []);
    }

    if (slipsListMatch && method === "POST") {
      const orderId = slipsListMatch[1];
      const { slip, items } = await req.json();
      const { data: created, error: sErr } = await supabase
        .from("supplementary_repair_slips")
        .insert([{ ...slip, order_id: orderId }])
        .select()
        .maybeSingle();
      if (sErr) return err(sErr.message);

      if (items?.length > 0 && created) {
        const itemsData = items.map((item: any, idx: number) => ({
          ...item,
          slip_id: created.id,
          order_index: idx,
        }));
        await supabase.from("supplementary_repair_items").insert(itemsData);
      }

      return json(created, 201);
    }

    const slipMatch = path.match(/^\/slips\/([^/]+)$/);
    if (slipMatch && method === "GET") {
      const slipId = slipMatch[1];
      const [slipRes, itemsRes] = await Promise.all([
        supabase.from("supplementary_repair_slips").select("*").eq("id", slipId).maybeSingle(),
        supabase.from("supplementary_repair_items").select("*").eq("slip_id", slipId).order("order_index"),
      ]);
      return json({ slip: slipRes.data, items: itemsRes.data || [] });
    }

    if (slipMatch && method === "DELETE") {
      const slipId = slipMatch[1];
      await supabase.from("supplementary_repair_items").delete().eq("slip_id", slipId);
      await supabase.from("supplementary_repair_slips").delete().eq("id", slipId);
      return json({ success: true });
    }

    if (slipMatch && method === "PUT") {
      const slipId = slipMatch[1];
      const body = await req.json();
      const { error: uErr } = await supabase
        .from("supplementary_repair_slips")
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq("id", slipId);
      if (uErr) return err(uErr.message);
      return json({ success: true });
    }

    // Supplementary quotes
    if (quotesListMatch && method === "GET") {
      const orderId = quotesListMatch[1];
      const { data } = await supabase
        .from("supplementary_quotes")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });
      return json(data || []);
    }

    if (quotesListMatch && method === "POST") {
      const orderId = quotesListMatch[1];
      const { quote, items } = await req.json();
      const { data: created, error: qErr } = await supabase
        .from("supplementary_quotes")
        .insert([{ ...quote, order_id: orderId }])
        .select()
        .maybeSingle();
      if (qErr) return err(qErr.message);

      if (items?.length > 0 && created) {
        const itemsData = items.map((item: any, idx: number) => ({
          ...item,
          quote_id: created.id,
          order_index: idx,
        }));
        await supabase.from("supplementary_quote_items").insert(itemsData);
      }

      return json(created, 201);
    }

    const sqMatch = path.match(/^\/squotes\/([^/]+)$/);
    if (sqMatch && method === "GET") {
      const quoteId = sqMatch[1];
      const [qRes, iRes] = await Promise.all([
        supabase.from("supplementary_quotes").select("*").eq("id", quoteId).maybeSingle(),
        supabase.from("supplementary_quote_items").select("*").eq("quote_id", quoteId).order("order_index"),
      ]);
      return json({ quote: qRes.data, items: iRes.data || [] });
    }

    const sqApproveMatch = path.match(/^\/squotes\/([^/]+)\/approve$/);
    if (sqApproveMatch && method === "POST") {
      const quoteId = sqApproveMatch[1];
      const { repairItems } = await req.json();

      await supabase
        .from("supplementary_quotes")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", quoteId);

      if (repairItems?.length > 0) {
        await supabase.from("repair_items").insert(repairItems);
      }

      return json({ success: true });
    }

    return err("Not found", 404);
  } catch (e) {
    return err(e.message || "Internal server error", 500);
  }
});
