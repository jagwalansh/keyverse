import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  if (!isSupabaseConfigured) {
    return new Response(JSON.stringify({ error: "Supabase is not configured" }), {
      status: 503,
    });
  }

  const url = new URL(req.url);
  const songId = url.searchParams.get("songId");
  const period = url.searchParams.get("period") || "alltime"; // alltime, weekly, daily

  let view = "alltime_leaderboard";
  if (period === "daily") view = "daily_leaderboard";
  if (period === "weekly") view = "weekly_leaderboard";

  let query = supabase.from(view).select("*").order("best_score", { ascending: false }).limit(50);

  if (songId) {
    query = query.eq("song_id", songId);
  }

  const { data, error } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }

  return new Response(JSON.stringify({ leaderboard: data }), { status: 200 });
}
