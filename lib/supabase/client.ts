import { createBrowserClient } from "@supabase/ssr";

// Client ini dipakai di komponen React ("use client") — jalan di browser user.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
