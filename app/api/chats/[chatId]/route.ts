import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(request: Request, { params }: { params: { chatId: string } }) {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Belum login." }, { status: 401 });
  }

  // RLS memastikan ini cuma berhasil kalau chat memang milik user yang login.
  // Pesan-pesan di dalamnya ikut terhapus otomatis (foreign key "on delete cascade").
  const { error } = await supabase
    .from("chats")
    .delete()
    .eq("id", params.chatId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
