import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase redirect ke sini setelah user selesai login lewat Google/GitHub.
// Kita tukar "code" dari URL jadi sesi login yang valid.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/chat`);
}
