import { corsHeaders } from "../../_lib/state.js";

// Cloudflare Pages Functions do not keep an in-memory client list across requests.
// Return 204 to stop EventSource retries; FinanceContext polls /api/sync/version as fallback.
export async function onRequest() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
