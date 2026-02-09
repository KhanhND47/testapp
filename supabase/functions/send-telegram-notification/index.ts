import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, x-app-token",
};

interface NotificationRequest {
  workerIds?: string[];
  chatIds?: string[];
  message: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { workerIds, chatIds, message }: NotificationRequest = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Missing required field: message" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if ((!workerIds || workerIds.length === 0) && (!chatIds || chatIds.length === 0)) {
      return new Response(
        JSON.stringify({ error: "Must provide either workerIds or chatIds" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { data: settings } = await supabase
      .from("app_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["telegram_bot_token", "telegram_notifications_enabled"]);

    const botToken = settings?.find(s => s.setting_key === "telegram_bot_token")?.setting_value;
    const notificationsEnabled = settings?.find(s => s.setting_key === "telegram_notifications_enabled")?.setting_value === "true";

    if (!notificationsEnabled) {
      return new Response(
        JSON.stringify({ success: true, message: "Notifications disabled" }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!botToken) {
      return new Response(
        JSON.stringify({ error: "Telegram bot token not configured" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const allChatIds: string[] = [];

    // Get chat IDs from worker IDs
    if (workerIds && workerIds.length > 0) {
      const { data: workers } = await supabase
        .from("repair_workers")
        .select("id, name, telegram_chat_id")
        .in("id", workerIds)
        .not("telegram_chat_id", "is", null);

      if (workers && workers.length > 0) {
        allChatIds.push(...workers.map(w => w.telegram_chat_id!));
      }
    }

    // Add direct chat IDs
    if (chatIds && chatIds.length > 0) {
      allChatIds.push(...chatIds);
    }

    // Remove duplicates
    const uniqueChatIds = [...new Set(allChatIds)];

    if (uniqueChatIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No recipients found" }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const results = [];
    for (const chatId of uniqueChatIds) {
      try {
        const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const telegramResponse = await fetch(telegramApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: "HTML",
          }),
        });

        const result = await telegramResponse.json();
        results.push({
          chatId,
          success: telegramResponse.ok,
          result,
        });
      } catch (error) {
        results.push({
          chatId,
          success: false,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
