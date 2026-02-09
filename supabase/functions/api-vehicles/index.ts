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

function canManageInspectionRequests(role: string) {
  return role === "admin" || role === "worker_lead";
}

function normalizeVietnamDateTimeInput(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return null;

  const raw = value.trim();
  if (!raw) return null;

  const localDateTimeMatch = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/
  );

  if (localDateTimeMatch) {
    const [, year, month, day, hour, minute, second] = localDateTimeMatch;
    const withTimezone = `${year}-${month}-${day}T${hour}:${minute}:${second || "00"}+07:00`;
    const ms = Date.parse(withTimezone);
    if (!Number.isNaN(ms)) {
      return new Date(ms).toISOString();
    }
  }

  const parsedMs = Date.parse(raw);
  if (Number.isNaN(parsedMs)) return null;
  return new Date(parsedMs).toISOString();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const user = await getUser(req);
    if (!user) return err("Unauthorized", 401);

    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/api-vehicles/, "") || "/";
    const method = req.method;

    if (path === "/" && method === "GET") {
      const { data, error } = await supabase
        .from("vehicle_repair_orders")
        .select("*, customers (name, phone), vehicles (name, license_plate)")
        .order("created_at", { ascending: false });
      if (error) return err(error.message);
      return json(data);
    }

    if (path === "/intake" && method === "POST") {
      const body = await req.json();
      const {
        customerType,
        customerName,
        phone,
        companyName,
        taxCode,
        address,
        vehicleName,
        vehicleYear,
        licensePlate,
        vin,
        odo,
        fuelLevel,
        requests,
      } = body;

      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("phone", phone)
        .maybeSingle();

      let customerId: string;

      if (existingCustomer) {
        customerId = existingCustomer.id;
        await supabase
          .from("customers")
          .update({
            customer_type: customerType,
            name: customerName,
            company_name: customerType === "company" ? companyName : null,
            tax_id: customerType === "company" ? taxCode : null,
            address: address || null,
          })
          .eq("id", customerId);
      } else {
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert([
            {
              customer_type: customerType,
              name: customerName,
              phone,
              company_name: customerType === "company" ? companyName : null,
              tax_id: customerType === "company" ? taxCode : null,
              address: address || null,
            },
          ])
          .select()
          .single();
        if (customerError) return err(customerError.message);
        customerId = newCustomer.id;
      }

      const { data: existingVehicle } = await supabase
        .from("vehicles")
        .select("id")
        .eq("license_plate", licensePlate)
        .maybeSingle();

      let vehicleId: string;

      if (existingVehicle) {
        vehicleId = existingVehicle.id;
        await supabase
          .from("vehicles")
          .update({
            customer_id: customerId,
            name: vehicleName,
            model_year: vehicleYear || null,
            vin: vin || null,
          })
          .eq("id", vehicleId);
      } else {
        const { data: newVehicle, error: vehicleError } = await supabase
          .from("vehicles")
          .insert([
            {
              customer_id: customerId,
              name: vehicleName,
              model_year: vehicleYear || null,
              license_plate: licensePlate,
              vin: vin || null,
            },
          ])
          .select()
          .single();
        if (vehicleError) return err(vehicleError.message);
        vehicleId = newVehicle.id;
      }

      const { data: roCode, error: roCodeError } = await supabase.rpc(
        "generate_ro_code"
      );
      if (roCodeError) return err(roCodeError.message);

      const { data: repairOrder, error: orderError } = await supabase
        .from("vehicle_repair_orders")
        .insert([
          {
            ro_code: roCode,
            customer_id: customerId,
            vehicle_id: vehicleId,
            advisor_id: user.id,
            received_at: new Date().toISOString(),
            odo: odo ? parseInt(odo) : null,
            fuel_level: fuelLevel || null,
            quote_intent: false,
            need_inspection: false,
            status: "received",
          },
        ])
        .select()
        .single();
      if (orderError) return err(orderError.message);

      const validRequests = (requests || []).filter(
        (r: { request_content: string }) => r.request_content?.trim()
      );
      if (validRequests.length > 0) {
        const requestsToInsert = validRequests.map(
          (
            r: { request_content: string; suggested_service: string },
            idx: number
          ) => ({
            repair_order_id: repairOrder.id,
            request_content: r.request_content,
            suggested_service: r.suggested_service || null,
            sort_order: idx,
          })
        );
        const { error: reqError } = await supabase
          .from("intake_requests")
          .insert(requestsToInsert);
        if (reqError) return err(reqError.message);
      }

      return json({ roCode, orderId: repairOrder.id }, 201);
    }

    const detailMatch = path.match(/^\/([^/]+)\/detail$/);
    if (detailMatch && method === "GET") {
      const orderId = detailMatch[1];

      const [
        orderResult,
        intakeResult,
        inspectionResult,
        diagnosisResult,
        quoteResult,
        serviceRequestResult,
      ] = await Promise.all([
        supabase
          .from("vehicle_repair_orders")
          .select(
            "*, customers (name, phone, company_name, tax_id, address), vehicles (name, model_year, license_plate, vin)"
          )
          .eq("id", orderId)
          .maybeSingle(),
        supabase
          .from("intake_requests")
          .select("*")
          .eq("repair_order_id", orderId)
          .order("sort_order"),
        supabase
          .from("inspection_requests")
          .select(
            "*, inspection_request_items (check_content, estimated_hours, note, technician_id, app_users (display_name))"
          )
          .eq("repair_order_id", orderId)
          .order("created_at", { ascending: false }),
        supabase
          .from("diagnosis_reports")
          .select(
            "*, app_users (display_name), diagnosis_lines (part_system, symptom, diagnosis, repair_plan, parts_materials, qty, sort_order)"
          )
          .eq("repair_order_id", orderId)
          .order("created_at", { ascending: false }),
        supabase
          .from("vr_quotes")
          .select("*, app_users:created_by (display_name)")
          .eq("repair_order_id", orderId)
          .order("created_at", { ascending: false }),
        supabase
          .from("vr_service_requests")
          .select(
            "*, app_users:created_by (display_name), general_repair_orders (ro_code, status, receive_date, return_date)"
          )
          .eq("repair_order_id", orderId)
          .order("created_at", { ascending: false }),
      ]);

      if (orderResult.error) return err(orderResult.error.message);
      if (!orderResult.data) return err("Order not found", 404);

      const quoteItemsMap: Record<string, unknown[]> = {};
      if (quoteResult.data && quoteResult.data.length > 0) {
        for (const quote of quoteResult.data) {
          const { data: items } = await supabase
            .from("vr_quote_items")
            .select("*")
            .eq("quote_id", quote.id)
            .order("order_index");
          quoteItemsMap[quote.id] = items || [];
        }
      }

      let supplementarySlips: unknown[] = [];
      let supplementaryQuotes: unknown[] = [];
      const gROId =
        (serviceRequestResult.data || []).find(
          (r: { general_repair_order_id: string | null }) =>
            r.general_repair_order_id
        )?.general_repair_order_id || null;

      if (gROId) {
        const [slipsResult, supQuotesResult] = await Promise.all([
          supabase
            .from("supplementary_repair_slips")
            .select("id, diagnosis_date, status, created_by, created_at")
            .eq("order_id", gROId)
            .order("created_at", { ascending: false }),
          supabase
            .from("supplementary_quotes")
            .select(
              "id, quote_date, total_amount, status, created_by, created_at"
            )
            .eq("order_id", gROId)
            .order("created_at", { ascending: false }),
        ]);

        const slipsWithCounts = await Promise.all(
          (slipsResult.data || []).map(async (slip: { id: string }) => {
            const { count } = await supabase
              .from("supplementary_repair_items")
              .select("*", { count: "exact", head: true })
              .eq("slip_id", slip.id);
            return { ...slip, item_count: count || 0 };
          })
        );
        supplementarySlips = slipsWithCounts;

        const quotesWithCounts = await Promise.all(
          (supQuotesResult.data || []).map(async (q: { id: string }) => {
            const { count } = await supabase
              .from("supplementary_quote_items")
              .select("*", { count: "exact", head: true })
              .eq("quote_id", q.id);
            return { ...q, item_count: count || 0 };
          })
        );
        supplementaryQuotes = quotesWithCounts;
      }

      return json({
        order: orderResult.data,
        intakeRequests: intakeResult.data || [],
        inspectionRequests: inspectionResult.data || [],
        diagnosisReports: diagnosisResult.data || [],
        quotes: quoteResult.data || [],
        quoteItems: quoteItemsMap,
        serviceRequests: serviceRequestResult.data || [],
        generalRepairOrderId: gROId,
        supplementarySlips,
        supplementaryQuotes,
      });
    }

    const inspReqDataMatch = path.match(
      /^\/([^/]+)\/inspection-request-data$/
    );
    if (inspReqDataMatch && method === "GET") {
      const orderId = inspReqDataMatch[1];
      const [requestsResult, techniciansResult] = await Promise.all([
        supabase
          .from("intake_requests")
          .select("*")
          .eq("repair_order_id", orderId)
          .order("sort_order"),
        supabase
          .from("app_users")
          .select("id, display_name")
          .in("role", ["worker", "worker_lead"])
          .eq("is_active", true),
      ]);
      if (requestsResult.error) return err(requestsResult.error.message);
      return json({
        intakeRequests: requestsResult.data || [],
        technicians: techniciansResult.data || [],
      });
    }

    const inspReqMatch = path.match(/^\/([^/]+)\/inspection-request$/);
    if (inspReqMatch && method === "POST") {
      if (user.role !== "admin") return err("Forbidden", 403);

      const orderId = inspReqMatch[1];
      const { checkStartTime, expectedResultTime, items } = await req.json();
      const normalizedCheckStartTime = normalizeVietnamDateTimeInput(checkStartTime);
      const normalizedExpectedResultTime = normalizeVietnamDateTimeInput(
        expectedResultTime
      );

      if (
        (checkStartTime && !normalizedCheckStartTime) ||
        (expectedResultTime && !normalizedExpectedResultTime)
      ) {
        return err("Invalid inspection datetime format");
      }

      if (
        normalizedCheckStartTime &&
        normalizedExpectedResultTime &&
        new Date(normalizedExpectedResultTime).getTime() <=
          new Date(normalizedCheckStartTime).getTime()
      ) {
        return err("Expected result time must be after check start time");
      }

      if (!Array.isArray(items) || items.length === 0) {
        return err("At least one inspection item is required");
      }

      const { data: inspectionRequest, error: inspError } = await supabase
        .from("inspection_requests")
        .insert([
          {
            repair_order_id: orderId,
            check_start_time: normalizedCheckStartTime,
            expected_result_time: normalizedExpectedResultTime,
          },
        ])
        .select()
        .single();
      if (inspError) return err(inspError.message);

      if (items && items.length > 0) {
        const itemsToInsert = items.map(
          (
            item: {
              intakeRequestId: string;
              checkContent: string;
              estimatedHours?: string | number | null;
              technicianId: string;
              note: string;
            },
            idx: number
          ) => ({
            inspection_request_id: inspectionRequest.id,
            intake_request_id: item.intakeRequestId,
            check_content: item.checkContent,
            estimated_hours:
              item.estimatedHours === undefined ||
              item.estimatedHours === null ||
              item.estimatedHours === ""
                ? null
                : Number(item.estimatedHours),
            technician_id: item.technicianId || null,
            note: item.note || null,
            sort_order: idx,
          })
        );
        const { error: itemsError } = await supabase
          .from("inspection_request_items")
          .insert(itemsToInsert);
        if (itemsError) return err(itemsError.message);
      }

      return json(inspectionRequest, 201);
    }

    if (path === "/inspection-technicians" && method === "GET") {
      if (!canManageInspectionRequests(user.role)) return err("Forbidden", 403);

      const { data, error } = await supabase
        .from("app_users")
        .select("id, display_name")
        .in("role", ["worker", "worker_lead"])
        .eq("is_active", true)
        .order("display_name");
      if (error) return err(error.message);
      return json(data || []);
    }

    const assignInspReqMatch = path.match(/^\/inspection-requests\/([^/]+)\/assign$/);
    if (assignInspReqMatch && method === "PUT") {
      if (!canManageInspectionRequests(user.role)) return err("Forbidden", 403);

      const requestId = assignInspReqMatch[1];
      const { checkStartTime, expectedResultTime, technicianId } = await req.json();
      const normalizedCheckStartTime = normalizeVietnamDateTimeInput(checkStartTime);
      const normalizedExpectedResultTime = normalizeVietnamDateTimeInput(
        expectedResultTime
      );

      if (
        !technicianId ||
        !normalizedCheckStartTime ||
        !normalizedExpectedResultTime
      ) {
        return err("Missing assignment data");
      }

      if (
        new Date(normalizedExpectedResultTime).getTime() <=
        new Date(normalizedCheckStartTime).getTime()
      ) {
        return err("Expected result time must be after check start time");
      }

      const { data: inspectionRequest, error: requestError } = await supabase
        .from("inspection_requests")
        .update({
          check_start_time: normalizedCheckStartTime,
          expected_result_time: normalizedExpectedResultTime,
        })
        .eq("id", requestId)
        .select("id, repair_order_id")
        .single();
      if (requestError) return err(requestError.message);

      const { error: assignItemsError } = await supabase
        .from("inspection_request_items")
        .update({ technician_id: technicianId })
        .eq("inspection_request_id", requestId);
      if (assignItemsError) return err(assignItemsError.message);

      await supabase
        .from("vehicle_repair_orders")
        .update({ status: "inspecting", updated_at: new Date().toISOString() })
        .eq("id", inspectionRequest.repair_order_id);

      return json({ success: true });
    }

    const diagnosisMatch = path.match(/^\/([^/]+)\/diagnosis$/);
    if (diagnosisMatch && method === "POST") {
      const orderId = diagnosisMatch[1];
      const { inspectionRequestId, diagnosisDate, lines } = await req.json();

      const { data: report, error: reportError } = await supabase
        .from("diagnosis_reports")
        .insert([
          {
            repair_order_id: orderId,
            inspection_request_id: inspectionRequestId,
            diagnosis_date: diagnosisDate,
            technician_id: user.id,
          },
        ])
        .select()
        .single();
      if (reportError) return err(reportError.message);

      if (lines && lines.length > 0) {
        const linesToInsert = lines.map(
          (line: Record<string, unknown>, idx: number) => ({
            diagnosis_report_id: report.id,
            part_system: line.part_system || null,
            symptom: line.symptom || null,
            diagnosis: line.diagnosis || null,
            repair_plan: line.repair_plan || null,
            parts_materials: line.parts_materials || null,
            qty: line.qty ? parseFloat(line.qty as string) : null,
            note: line.note || null,
            sort_order: idx,
          })
        );
        const { error: linesError } = await supabase
          .from("diagnosis_lines")
          .insert(linesToInsert);
        if (linesError) return err(linesError.message);
      }

      await supabase
        .from("vehicle_repair_orders")
        .update({ status: "diagnosed", updated_at: new Date().toISOString() })
        .eq("id", orderId);

      return json(report, 201);
    }

    const approveQuoteMatch = path.match(/^\/([^/]+)\/approve-quote$/);
    if (approveQuoteMatch && method === "PUT") {
      const orderId = approveQuoteMatch[1];
      const { quoteId } = await req.json();

      const { error: quoteError } = await supabase
        .from("vr_quotes")
        .update({ status: "approved" })
        .eq("id", quoteId);
      if (quoteError) return err(quoteError.message);

      await supabase
        .from("vehicle_repair_orders")
        .update({ status: "approved" })
        .eq("id", orderId);

      return json({ success: true });
    }

    if (path === "/inspection-requests" && method === "GET") {
      if (!canManageInspectionRequests(user.role)) return err("Forbidden", 403);

      const { data, error } = await supabase
        .from("inspection_requests")
        .select(
          `*, vehicle_repair_orders (ro_code, status, customers (name, phone), vehicles (name, license_plate)), diagnosis_reports (id, diagnosis_date), inspection_request_items (id, technician_id, app_users (display_name))`
        )
        .order("created_at", { ascending: false });
      if (error) return err(error.message);

      const normalized = (data || []).map((request: Record<string, unknown>) => ({
        ...request,
        inspection_request_items: request.inspection_request_items || [],
        diagnosis_reports: request.diagnosis_reports || [],
      }));
      return json(normalized);
    }

    const inspReqItemsMatch = path.match(
      /^\/inspection-request-items\/([^/]+)$/
    );
    if (inspReqItemsMatch && method === "GET") {
      const requestId = inspReqItemsMatch[1];
      const { data, error } = await supabase
        .from("inspection_request_items")
        .select("*, app_users (display_name)")
        .eq("inspection_request_id", requestId)
        .order("sort_order");
      if (error) return err(error.message);
      return json(data);
    }

    return err("Not found", 404);
  } catch (e) {
    return err(e.message || "Internal server error", 500);
  }
});
