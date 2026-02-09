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
    const path = url.pathname.replace(/^\/api-quotes/, "") || "/";
    const method = req.method;

    if (path === "/" && method === "GET") {
      const { data: diagnosisData, error } = await supabase
        .from("diagnosis_reports")
        .select(
          `*, app_users (display_name), vehicle_repair_orders (ro_code, status, customers (name, phone), vehicles (license_plate, name))`
        )
        .order("created_at", { ascending: false });
      if (error) return err(error.message);

      const reportsWithQuotes = await Promise.all(
        (diagnosisData || []).map(async (report: { id: string }) => {
          const { data: quote } = await supabase
            .from("vr_quotes")
            .select("id, quote_code, status")
            .eq("diagnosis_report_id", report.id)
            .maybeSingle();
          return { ...report, quote };
        })
      );

      return json(reportsWithQuotes);
    }

    if (path === "/parts/search" && method === "GET") {
      const q = url.searchParams.get("q") || "";
      if (!q) return json([]);
      const { data, error } = await supabase
        .from("parts")
        .select("id, part_code, part_name, supplier_name, sale_price")
        .ilike("part_name", `%${q}%`)
        .limit(10);
      if (error) return err(error.message);
      return json(data);
    }

    const detailMatch = path.match(/^\/([^/]+)\/detail$/);
    if (detailMatch && method === "GET") {
      const reportId = detailMatch[1];

      const { data: report, error: reportError } = await supabase
        .from("diagnosis_reports")
        .select("*, repair_order_id, inspection_request_id")
        .eq("id", reportId)
        .maybeSingle();
      if (reportError) return err(reportError.message);
      if (!report) return err("Report not found", 404);

      const repairOrderId = report.repair_order_id;
      const inspectionRequestId = report.inspection_request_id;

      const [linesRes, intakeRes, quoteRes] = await Promise.all([
        supabase
          .from("diagnosis_lines")
          .select("*")
          .eq("diagnosis_report_id", reportId)
          .order("sort_order"),
        supabase
          .from("intake_requests")
          .select("*")
          .eq("repair_order_id", repairOrderId)
          .order("sort_order"),
        supabase
          .from("vr_quotes")
          .select("*")
          .eq("diagnosis_report_id", reportId)
          .maybeSingle(),
      ]);

      let inspectedIntakeIds: string[] = [];
      if (inspectionRequestId) {
        const { data: inspItems } = await supabase
          .from("inspection_request_items")
          .select("intake_request_id")
          .eq("inspection_request_id", inspectionRequestId)
          .not("intake_request_id", "is", null);
        inspectedIntakeIds = (inspItems || []).map(
          (i: { intake_request_id: string }) => i.intake_request_id
        );
      }

      let quoteItems: unknown[] = [];
      if (quoteRes.data) {
        const { data: items } = await supabase
          .from("vr_quote_items")
          .select("*")
          .eq("quote_id", quoteRes.data.id)
          .order("order_index");
        quoteItems = items || [];
      }

      return json({
        diagnosisLines: linesRes.data || [],
        intakeRequests: intakeRes.data || [],
        inspectedIntakeIds,
        existingQuote: quoteRes.data,
        quoteItems,
      });
    }

    if (path === "/" && method === "POST") {
      const { reportId, repairOrderId, existingQuoteId, items, totalAmount } =
        await req.json();

      let quoteId = existingQuoteId;

      if (existingQuoteId) {
        const { error: updateError } = await supabase
          .from("vr_quotes")
          .update({ total_amount: totalAmount })
          .eq("id", existingQuoteId);
        if (updateError) return err(updateError.message);

        await supabase
          .from("vr_quote_items")
          .delete()
          .eq("quote_id", existingQuoteId);
      } else {
        const { data: quoteCode, error: rpcError } = await supabase.rpc(
          "generate_vr_quote_code"
        );
        if (rpcError) return err(rpcError.message);

        const { data: newQuote, error: insertError } = await supabase
          .from("vr_quotes")
          .insert([
            {
              repair_order_id: repairOrderId,
              diagnosis_report_id: reportId,
              quote_code: quoteCode,
              quote_date: new Date().toISOString(),
              status: "draft",
              total_amount: totalAmount,
              created_by: user.id,
            },
          ])
          .select()
          .single();
        if (insertError) return err(insertError.message);
        quoteId = newQuote.id;
      }

      if (items && items.length > 0) {
        const itemsToInsert = items.map(
          (item: Record<string, unknown>, idx: number) => ({
            ...item,
            quote_id: quoteId,
            order_index: idx,
            sort_order: idx,
          })
        );
        const { error: itemsError } = await supabase
          .from("vr_quote_items")
          .insert(itemsToInsert);
        if (itemsError) return err(itemsError.message);
      }

      if (!existingQuoteId) {
        await supabase
          .from("vehicle_repair_orders")
          .update({ status: "quoted", updated_at: new Date().toISOString() })
          .eq("id", repairOrderId);
      }

      return json({ quoteId }, 201);
    }

    const approveMatch = path.match(/^\/([^/]+)\/approve$/);
    if (approveMatch && method === "PUT") {
      const quoteId = approveMatch[1];

      const { data: quote, error: quoteError } = await supabase
        .from("vr_quotes")
        .select("repair_order_id")
        .eq("id", quoteId)
        .maybeSingle();
      if (quoteError) return err(quoteError.message);
      if (!quote) return err("Quote not found", 404);

      const { error: updateError } = await supabase
        .from("vr_quotes")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
        })
        .eq("id", quoteId);
      if (updateError) return err(updateError.message);

      await supabase
        .from("vehicle_repair_orders")
        .update({
          status: "WAIT_CUSTOMER_APPROVAL_QUOTE",
          updated_at: new Date().toISOString(),
        })
        .eq("id", quote.repair_order_id);

      return json({ success: true });
    }

    return err("Not found", 404);
  } catch (e) {
    return err(e.message || "Internal server error", 500);
  }
});
