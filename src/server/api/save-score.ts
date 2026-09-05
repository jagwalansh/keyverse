import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseAnonKey } from "@/lib/supabase";

type ScoreResult = {
  status: string;
  score: number;
  previous_score?: number;
};

export async function POST(req: Request) {
  const {
    songId,
    artist,
    track,
    score,
    accuracy,
    consistency,
    typedCharacters,
    completedLyrics,
    inactivityMisses,
    previewUrl,
    artUrl,
  } = await req.json();

  const numericScore = Number(score);
  const numericAccuracy = Number(accuracy);
  const numericConsistency = Number(consistency);
  const numericTypedCharacters = Number(typedCharacters);
  const numericInactivityMisses = Number(inactivityMisses);

  if (
    !Number.isFinite(numericScore) ||
    !Number.isFinite(numericAccuracy) ||
    !Number.isFinite(numericConsistency) ||
    !Number.isFinite(numericTypedCharacters) ||
    !Number.isFinite(numericInactivityMisses)
  ) {
    return new Response(JSON.stringify({ error: "Invalid score payload" }), {
      status: 400,
    });
  }

  if (numericScore <= 0 || numericTypedCharacters <= 0 || completedLyrics !== true) {
    return new Response(
      JSON.stringify({
        error: "Incomplete rounds are not eligible for the leaderboard",
      }),
      { status: 400 },
    );
  }

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

  const {
    data: { user },
    error: authError,
  } = await userSupabase.auth.getUser();

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
    p_score: Math.trunc(numericScore),
    p_accuracy: numericAccuracy,
    p_consistency: numericConsistency,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }

  const scoreResult = data as ScoreResult;

  // Determine if this was a new PB
  const isNewPb =
    scoreResult.status === "updated" ||
    scoreResult.status === "inserted" ||
    scoreResult.status === "inserted_and_pruned";

  // Compute leaderboard rank for this song
  let rank: number | null = null;
  let totalPlayers: number | null = null;

  try {
    // Count how many distinct users have a higher score on this song
    const { count: higherCount } = await userSupabase
      .from("scores")
      .select("*", { count: "exact", head: true })
      .eq("song_id", songId)
      .gt("score", scoreResult.score);

    // Count total distinct players on this song
    const { count: total } = await userSupabase
      .from("scores")
      .select("*", { count: "exact", head: true })
      .eq("song_id", songId);

    if (higherCount !== null) {
      rank = higherCount + 1;
    }
    totalPlayers = total;
  } catch {
    // Non-critical: if rank query fails, just omit it
  }

  return new Response(
    JSON.stringify({
      score: scoreResult,
      isNewPb,
      rank,
      totalPlayers,
      previousScore: scoreResult.previous_score ?? null,
    }),
    { status: 200 },
  );
}
