import { corsHeaders, json } from "../../_lib/state.js";

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  return json({
    success: true,
    serverTime: new Date().toISOString(),
    connectedClients: 0,
    status: "cloud_ready",
  });
}
