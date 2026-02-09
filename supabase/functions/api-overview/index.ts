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
const WORKDAY_TARGET_MINUTES = 8 * 60;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getVietnamDayKey(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: VIETNAM_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function timeToMs(value: string | null | undefined) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function computeTimeProgress(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
  nowMs: number
) {
  const startMs = timeToMs(startTime);
  const endMs = timeToMs(endTime);
  if (startMs === null || endMs === null || endMs <= startMs) return null;
  if (nowMs <= startMs) return 0;
  if (nowMs >= endMs) return 100;
  return Math.round(((nowMs - startMs) / (endMs - startMs)) * 100);
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function isMissingAssignedWorkersTable(
  error: { message?: string } | null | undefined
) {
  const message = error?.message || "";
  return (
    message.includes("repair_item_assigned_workers") &&
    (message.includes("does not exist") || message.includes("schema cache"))
  );
}

function isMissingEstimatedDurationColumn(
  error: { message?: string } | null | undefined
) {
  const message = error?.message || "";
  return (
    message.includes("estimated_duration_minutes") &&
    (message.includes("does not exist") || message.includes("schema cache"))
  );
}

function isMissingWorkloadColumns(
  error: { message?: string } | null | undefined
) {
  const message = error?.message || "";
  return (
    (message.includes("workload_engaged_at") ||
      message.includes("priority_marked_at") ||
      message.includes("workload_engaged_by")) &&
    (message.includes("does not exist") || message.includes("schema cache"))
  );
}

function getRepairProgress(items: any[]) {
  const childItems = items.filter((item: any) => item.parent_id !== null);
  const parentItems = items.filter((item: any) => item.parent_id === null);
  const parentsWithChildren = new Set(childItems.map((item: any) => item.parent_id));
  const leafItems =
    childItems.length > 0
      ? childItems
      : parentItems.filter((item: any) => !parentsWithChildren.has(item.id));

  const total = leafItems.length;
  const completed = leafItems.filter((item: any) => item.status === "completed").length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, progress };
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
    const path = url.pathname.replace(/^\/api-overview/, "") || "/";
    const method = req.method;

    if (path === "/" && method === "GET") {
      const [vrOrdersRes, repairOrdersRes, inspectionsRes] = await Promise.all([
        supabase.from("vehicle_repair_orders").select("id, status"),
        supabase
          .from("general_repair_orders")
          .select("id, status, return_date"),
        supabase
          .from("quality_inspections")
          .select("id, repair_order_id, overall_result, status"),
      ]);

      return json({
        vrOrders: vrOrdersRes.data || [],
        repairOrders: repairOrdersRes.data || [],
        inspections: inspectionsRes.data || [],
      });
    }

    if (path === "/performance" && method === "GET") {
      const now = new Date();
      const nowMs = now.getTime();
      const todayKey = getVietnamDayKey(now);
      const recentAssignmentsThreshold = new Date(
        nowMs - 1000 * 60 * 60 * 24 * 3
      ).toISOString();

      const [
        appointmentsRes,
        inspectionRequestsRes,
        waitingPartsRes,
        waitingDeliveryRes,
        activeRepairItemsRes,
        workersRes,
        workerAssignmentsRes,
      ] = await Promise.all([
        supabase
          .from("appointments")
          .select("*")
          .eq("appointment_date", todayKey)
          .order("appointment_time", { ascending: true }),
        supabase
          .from("inspection_requests")
          .select(
            `
              id,
              repair_order_id,
              check_start_time,
              expected_result_time,
              created_at,
              vehicle_repair_orders (
                id,
                ro_code,
                status,
                customers (name),
                vehicles (name, license_plate)
              ),
              inspection_request_items (
                technician_id,
                app_users (display_name)
              ),
              diagnosis_reports (id)
            `
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("general_repair_orders")
          .select(
            "id, ro_code, license_plate, vehicle_name, customer_name, parts_order_start_time, parts_expected_end_time, parts_note, updated_at"
          )
          .eq("waiting_for_parts", true)
          .order("parts_expected_end_time", { ascending: true, nullsFirst: false }),
        supabase
          .from("general_repair_orders")
          .select(
            "id, ro_code, license_plate, vehicle_name, customer_name, return_date, updated_at"
          )
          .eq("status", "completed")
          .order("updated_at", { ascending: false }),
        supabase
          .from("repair_items")
          .select("id, order_id, status, parent_id, worker_id")
          .eq("status", "in_progress"),
        supabase
          .from("repair_workers")
          .select("id, name, worker_type")
          .eq("is_active", true)
          .order("worker_type")
          .order("name"),
        supabase
          .from("repair_item_assigned_workers")
          .select(
            `
              worker_id,
              assigned_at,
              repair_item_id,
              workload_engaged_at,
              priority_marked_at,
              workload_engaged_by
            `
          )
          .or(
            `assigned_at.gte.${recentAssignmentsThreshold},workload_engaged_at.gte.${recentAssignmentsThreshold}`
          ),
      ]);

      if (appointmentsRes.error) return err(appointmentsRes.error.message);
      if (inspectionRequestsRes.error) return err(inspectionRequestsRes.error.message);
      if (waitingPartsRes.error) return err(waitingPartsRes.error.message);
      if (waitingDeliveryRes.error) return err(waitingDeliveryRes.error.message);
      if (activeRepairItemsRes.error) return err(activeRepairItemsRes.error.message);
      if (workersRes.error) return err(workersRes.error.message);
      if (
        workerAssignmentsRes.error &&
        !isMissingAssignedWorkersTable(workerAssignmentsRes.error)
      ) {
        if (!isMissingWorkloadColumns(workerAssignmentsRes.error)) {
          return err(workerAssignmentsRes.error.message);
        }
      }

      let workerAssignments = workerAssignmentsRes.data || [];
      if (
        workerAssignmentsRes.error &&
        isMissingWorkloadColumns(workerAssignmentsRes.error)
      ) {
        const fallbackAssignmentsRes = await supabase
          .from("repair_item_assigned_workers")
          .select(
            `
              worker_id,
              assigned_at,
              repair_item_id
            `
          )
          .gte("assigned_at", recentAssignmentsThreshold);
        if (
          fallbackAssignmentsRes.error &&
          !isMissingAssignedWorkersTable(fallbackAssignmentsRes.error)
        ) {
          return err(fallbackAssignmentsRes.error.message);
        }
        workerAssignments = fallbackAssignmentsRes.data || [];
      }

      if (
        workerAssignmentsRes.error &&
        isMissingAssignedWorkersTable(workerAssignmentsRes.error)
      ) {
        workerAssignments = [];
      }

      if (
        workerAssignmentsRes.error &&
        !isMissingAssignedWorkersTable(workerAssignmentsRes.error) &&
        !isMissingWorkloadColumns(workerAssignmentsRes.error)
      ) {
        return err(workerAssignmentsRes.error.message);
      }

      const appointments = (appointmentsRes.data || []).map((item: any) => ({
        id: item.id,
        license_plate: item.license_plate,
        customer_name: item.customer_name,
        vehicle_name: item.vehicle_name,
        phone: item.phone,
        appointment_date: item.appointment_date,
        appointment_time: item.appointment_time,
        expected_return_date: item.expected_return_date,
        service_type: item.service_type,
        status: item.status,
      }));

      const inspectionRows = inspectionRequestsRes.data || [];
      const waitingInspection: any[] = [];
      const inspectingVehicles: any[] = [];

      for (const row of inspectionRows) {
        const order = row.vehicle_repair_orders;
        if (!order) continue;

        const hasDiagnosis = (row.diagnosis_reports || []).length > 0;
        if (hasDiagnosis) continue;

        const inspectionItems = row.inspection_request_items || [];
        const hasTimeRange = Boolean(
          row.check_start_time && row.expected_result_time
        );
        const hasItems = inspectionItems.length > 0;
        const allItemsAssigned = hasItems
          ? inspectionItems.every((item: any) => Boolean(item.technician_id))
          : false;
        const isAssignedInspection = hasTimeRange && allItemsAssigned;

        const technicianNames = uniqueStrings(
          inspectionItems.map((item: any) => item.app_users?.display_name)
        );

        const progress = computeTimeProgress(
          row.check_start_time,
          row.expected_result_time,
          nowMs
        );

        const requestData = {
          id: row.id,
          repair_order_id: row.repair_order_id,
          ro_code: order.ro_code,
          status: order.status,
          customer_name: order.customers?.name || "",
          vehicle_name: order.vehicles?.name || "",
          license_plate: order.vehicles?.license_plate || "",
          check_start_time: row.check_start_time,
          expected_result_time: row.expected_result_time,
          created_at: row.created_at,
          technicians: technicianNames,
          progress: progress ?? 0,
        };

        const createdMs = timeToMs(row.created_at);
        const createdToday =
          createdMs !== null && getVietnamDayKey(new Date(createdMs)) === todayKey;

        if (!isAssignedInspection && createdToday) {
          waitingInspection.push(requestData);
        }

        if (isAssignedInspection) {
          inspectingVehicles.push(requestData);
        }
      }

      waitingInspection.sort((a, b) => {
        const aMs = timeToMs(a.created_at) ?? Number.MAX_SAFE_INTEGER;
        const bMs = timeToMs(b.created_at) ?? Number.MAX_SAFE_INTEGER;
        return aMs - bMs;
      });

      inspectingVehicles.sort((a, b) => {
        const aMs = timeToMs(a.expected_result_time) ?? Number.MAX_SAFE_INTEGER;
        const bMs = timeToMs(b.expected_result_time) ?? Number.MAX_SAFE_INTEGER;
        return aMs - bMs;
      });

      const waitingParts = (waitingPartsRes.data || []).map((item: any) => ({
        id: item.id,
        ro_code: item.ro_code,
        license_plate: item.license_plate,
        vehicle_name: item.vehicle_name,
        customer_name: item.customer_name,
        parts_order_start_time: item.parts_order_start_time,
        parts_expected_end_time: item.parts_expected_end_time,
        parts_note: item.parts_note,
        updated_at: item.updated_at,
        progress:
          computeTimeProgress(
            item.parts_order_start_time,
            item.parts_expected_end_time,
            nowMs
          ) ?? 0,
      }));

      const waitingDelivery = (waitingDeliveryRes.data || []).map((item: any) => ({
        id: item.id,
        ro_code: item.ro_code,
        license_plate: item.license_plate,
        vehicle_name: item.vehicle_name,
        customer_name: item.customer_name,
        return_date: item.return_date,
        updated_at: item.updated_at,
      }));

      const activeRepairItems = activeRepairItemsRes.data || [];
      const activeOrderIds = uniqueStrings(
        activeRepairItems.map((item: any) => item.order_id)
      );

      let repairingVehicles: any[] = [];
      if (activeOrderIds.length > 0) {
        const activeItemIds = activeRepairItems.map((item: any) => item.id);
        const [
          activeOrdersRes,
          allOrderItemsRes,
          activeAssignmentsRes,
        ] = await Promise.all([
          supabase
            .from("general_repair_orders")
            .select(
              "id, ro_code, license_plate, vehicle_name, customer_name, receive_date, return_date, status, updated_at"
            )
            .in("id", activeOrderIds),
          supabase
            .from("repair_items")
            .select("id, order_id, status, parent_id, worker_id")
            .in("order_id", activeOrderIds),
          supabase
            .from("repair_item_assigned_workers")
            .select("repair_item_id, worker_id")
            .in("repair_item_id", activeItemIds),
        ]);

        if (activeOrdersRes.error) return err(activeOrdersRes.error.message);
        if (allOrderItemsRes.error) return err(allOrderItemsRes.error.message);
        if (
          activeAssignmentsRes.error &&
          !isMissingAssignedWorkersTable(activeAssignmentsRes.error)
        ) {
          return err(activeAssignmentsRes.error.message);
        }

        const workerIdsFromItems = uniqueStrings(
          activeRepairItems.map((item: any) => item.worker_id)
        );
        const workerIdsFromAssignments = uniqueStrings(
          (activeAssignmentsRes.data || []).map((item: any) => item.worker_id)
        );
        const workerIds = uniqueStrings([
          ...workerIdsFromItems,
          ...workerIdsFromAssignments,
        ]);

        const workerNames = new Map<string, string>();
        if (workerIds.length > 0) {
          const { data: activeWorkers, error: activeWorkersErr } = await supabase
            .from("repair_workers")
            .select("id, name")
            .in("id", workerIds);
          if (activeWorkersErr) return err(activeWorkersErr.message);
          for (const worker of activeWorkers || []) {
            workerNames.set(worker.id, worker.name);
          }
        }

        const orderItemsMap = new Map<string, any[]>();
        for (const item of allOrderItemsRes.data || []) {
          const list = orderItemsMap.get(item.order_id) || [];
          list.push(item);
          orderItemsMap.set(item.order_id, list);
        }

        const activeItemsMap = new Map<string, any[]>();
        for (const item of activeRepairItems) {
          const list = activeItemsMap.get(item.order_id) || [];
          list.push(item);
          activeItemsMap.set(item.order_id, list);
        }

        const activeAssignmentsMap = new Map<string, string[]>();
        for (const item of activeAssignmentsRes.data || []) {
          const list = activeAssignmentsMap.get(item.repair_item_id) || [];
          list.push(item.worker_id);
          activeAssignmentsMap.set(item.repair_item_id, list);
        }

        repairingVehicles = (activeOrdersRes.data || []).map((order: any) => {
          const items = orderItemsMap.get(order.id) || [];
          const { total, completed, progress } = getRepairProgress(items);
          const inProgressItems = activeItemsMap.get(order.id) || [];
          const activeWorkerIds = uniqueStrings(
            inProgressItems.flatMap((item: any) => [
              item.worker_id,
              ...(activeAssignmentsMap.get(item.id) || []),
            ])
          );

          return {
            id: order.id,
            ro_code: order.ro_code,
            license_plate: order.license_plate,
            vehicle_name: order.vehicle_name,
            customer_name: order.customer_name,
            receive_date: order.receive_date,
            return_date: order.return_date,
            updated_at: order.updated_at,
            progress,
            completed_items: completed,
            total_items: total,
            active_workers: activeWorkerIds
              .map((id) => workerNames.get(id))
              .filter(Boolean),
          };
        });

        repairingVehicles.sort((a, b) => {
          const aMs = timeToMs(a.return_date) ?? Number.MAX_SAFE_INTEGER;
          const bMs = timeToMs(b.return_date) ?? Number.MAX_SAFE_INTEGER;
          return aMs - bMs;
        });
      }

      const workers = workersRes.data || [];
      const assignmentItemIds = uniqueStrings(
        workerAssignments.map((assignment: any) => assignment.repair_item_id)
      );
      const estimatedMinutesByItemId = new Map<string, number>();
      const startedAtByItemId = new Map<string, string | null>();
      const startedWorkerByItemId = new Map<string, string | null>();

      if (assignmentItemIds.length > 0) {
        const { data: estimatedRows, error: estimatedRowsErr } = await supabase
          .from("repair_items")
          .select("id, estimated_duration_minutes, started_at, worker_id")
          .in("id", assignmentItemIds);

        if (
          estimatedRowsErr &&
          !isMissingEstimatedDurationColumn(estimatedRowsErr)
        ) {
          return err(estimatedRowsErr.message);
        }

        for (const row of estimatedRows || []) {
          const numericValue = Number(row.estimated_duration_minutes || 0);
          estimatedMinutesByItemId.set(
            row.id,
            Number.isFinite(numericValue) ? numericValue : 0
          );
          startedAtByItemId.set(row.id, row.started_at || null);
          startedWorkerByItemId.set(row.id, row.worker_id || null);
        }
      }

      const assignedMinutesMap = new Map<string, number>();
      const assignedJobsMap = new Map<string, number>();
      const fallbackToAssignedAt = workerAssignments.some(
        (assignment: any) => assignment.workload_engaged_at === undefined
      );

      for (const assignment of workerAssignments) {
        const engagedAt = assignment.workload_engaged_at || null;
        let timestampToUse = engagedAt || (fallbackToAssignedAt ? assignment.assigned_at : null);

        if (!timestampToUse && !fallbackToAssignedAt) {
          const itemStartedAt = startedAtByItemId.get(assignment.repair_item_id) || null;
          const startedWorkerId = startedWorkerByItemId.get(assignment.repair_item_id) || null;
          if (
            itemStartedAt &&
            startedWorkerId &&
            startedWorkerId === assignment.worker_id
          ) {
            timestampToUse = itemStartedAt;
          }
        }

        if (!timestampToUse) {
          continue;
        }
        if (getVietnamDayKey(new Date(timestampToUse)) !== todayKey) {
          continue;
        }
        const estimatedMinutes = Number(
          estimatedMinutesByItemId.get(assignment.repair_item_id) || 0
        );
        const prevMinutes = assignedMinutesMap.get(assignment.worker_id) || 0;
        const prevJobs = assignedJobsMap.get(assignment.worker_id) || 0;
        assignedMinutesMap.set(
          assignment.worker_id,
          prevMinutes + (Number.isFinite(estimatedMinutes) ? estimatedMinutes : 0)
        );
        assignedJobsMap.set(assignment.worker_id, prevJobs + 1);
      }

      const workerPerformance = workers.map((worker: any) => {
        const assignedMinutes = assignedMinutesMap.get(worker.id) || 0;
        const assignedJobs = assignedJobsMap.get(worker.id) || 0;
        const utilization = Math.min(
          100,
          Math.round((assignedMinutes / WORKDAY_TARGET_MINUTES) * 100)
        );

        return {
          id: worker.id,
          name: worker.name,
          worker_type: worker.worker_type,
          assigned_minutes: assignedMinutes,
          remaining_minutes: Math.max(0, WORKDAY_TARGET_MINUTES - assignedMinutes),
          assigned_jobs: assignedJobs,
          target_minutes: WORKDAY_TARGET_MINUTES,
          utilization_percent: utilization,
        };
      });

      const repairWorkerPerformance = workerPerformance
        .filter((worker) => worker.worker_type === "repair")
        .sort((a, b) => b.utilization_percent - a.utilization_percent);
      const paintWorkerPerformance = workerPerformance
        .filter((worker) => worker.worker_type === "paint")
        .sort((a, b) => b.utilization_percent - a.utilization_percent);

      return json({
        generated_at: now.toISOString(),
        today_key: todayKey,
        sections: {
          appointments: {
            total: appointments.length,
            items: appointments,
          },
          waiting_inspection: {
            total: waitingInspection.length,
            items: waitingInspection,
          },
          waiting_parts: {
            total: waitingParts.length,
            items: waitingParts,
          },
          waiting_delivery: {
            total: waitingDelivery.length,
            items: waitingDelivery,
          },
          inspecting_vehicles: {
            total: inspectingVehicles.length,
            items: inspectingVehicles,
          },
          repairing_vehicles: {
            total: repairingVehicles.length,
            items: repairingVehicles,
          },
          worker_performance: {
            target_minutes: WORKDAY_TARGET_MINUTES,
            repair_workers: repairWorkerPerformance,
            paint_workers: paintWorkerPerformance,
          },
        },
      });
    }

    return err("Not found", 404);
  } catch (e) {
    return err(e.message || "Internal server error", 500);
  }
});
