import { corsHeaders, failure, json, readState } from "../../_lib/state.js";

export async function onRequestGet({ env }) {
  try {
    const current = await readState(env);
    return json({
      success: true,
      version: current.version,
      hash: current.hash,
      lastSavedAt: current.lastSavedAt,
    });
  } catch (error) {
    return failure(error);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
