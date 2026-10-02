import { corsHeaders, failure, json, readState, stateCounts } from "../../_lib/state.js";

export async function onRequestGet({ env }) {
  try {
    const current = await readState(env);
    return json({
      success: true,
      initialized: Boolean(current.data),
      version: current.version,
      hash: current.hash,
      counts: stateCounts(current.data || {}),
      lastSavedAt: current.lastSavedAt,
    });
  } catch (error) {
    return failure(error);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
