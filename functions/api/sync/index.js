import { corsHeaders, failure, json, readState, saveState } from "../../_lib/state.js";

export async function onRequestGet({ env }) {
  try {
    const current = await readState(env);
    if (!current.data) {
      return json({
        success: true,
        data: null,
        message: "Database belum diinisialisasi",
        serverTime: new Date().toISOString(),
      });
    }
    return json({ success: true, data: current.data, hash: current.hash, serverTime: new Date().toISOString() });
  } catch (error) {
    return failure(error);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const payload = await request.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return json({ success: false, error: "Format data tidak valid." }, 400);
    }
    const saved = await saveState(env, payload);
    return json({ success: true, ...saved });
  } catch (error) {
    if (error instanceof SyntaxError) return json({ success: false, error: "JSON tidak valid." }, 400);
    return failure(error);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
