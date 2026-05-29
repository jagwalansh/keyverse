import { supabase } from "@/lib/supabase";

export async function GET() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const { data, error } = await supabase
    .from("scores")
    .select(`
      score,
      accuracy,
      consistency,
      created_at,
      song_id,
      songs!inner (
        artist,
        track,
        art_url
      )
    `)
    .eq("user_id", user.id)
    .order("score", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }

  return new Response(JSON.stringify({ pb: data }), { status: 200 });
}
