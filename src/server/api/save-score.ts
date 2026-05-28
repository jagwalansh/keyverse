import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseAnonKey } from "@/lib/supabase";

export async function POST(req: Request) {
  const { songId, artist, track, score, accuracy, consistency, previewUrl, artUrl } =
    await req.json();

  // Get current user from Authorization header
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  // Create a request-scoped client using the user's JWT
  const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: { user }, error: authError } = await userSupabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: authError?.message || "Unauthorized" }), {
      status: 401,
    });
  }

  // Ensure song exists
  const { data: existingSong } = await userSupabase
    .from("songs")
    .select("id")
    .eq("id", songId)
    .single();

  if (!existingSong) {
    // Insert song if it doesn't exist
    await userSupabase.from("songs").insert({
      id: songId,
      artist,
      track,
      preview_url: previewUrl,
      art_url: artUrl,
    });
  }

  // Save score using RPC function to enforce high-score only and top-50 limit
  const { data, error } = await userSupabase.rpc("save_user_score", {
    p_user_id: user.id,
    p_song_id: songId,
    p_score: score,
    p_accuracy: accuracy,
    p_consistency: consistency,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }

  return new Response(JSON.stringify({ score: data }), { status: 200 });
}
