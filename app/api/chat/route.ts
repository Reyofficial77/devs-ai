import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askGemini, type GeminiHistoryItem } from "@/lib/gemini";
import type { MessageRow } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Belum login." }, { status: 401 });
  }

  const body = await request.json();
  const { message, chatId } = body as { message: string; chatId: string | null };

  if (!message || !message.trim()) {
    return NextResponse.json({ error: "Pesan kosong." }, { status: 400 });
  }

  try {
    let activeChatId = chatId;

    // Kalau belum ada chat aktif, buat chat baru dulu.
    // Judul chat diambil dari 50 karakter pertama pesan user.
    if (!activeChatId) {
      const title = message.trim().slice(0, 50);
      const { data: newChat, error: chatError } = await supabase
        .from("chats")
        .insert({ user_id: user.id, title })
        .select()
        .single();

      if (chatError) throw chatError;
      activeChatId = newChat.id;
    }

    // Ambil histori pesan sebelumnya di chat ini, biar Gemini punya konteks percakapan.
    const { data: previousMessages } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", activeChatId)
      .order("created_at", { ascending: true });

    const history: GeminiHistoryItem[] = (previousMessages || []).map((m: MessageRow) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }]
    }));

    // Simpan pesan user ke database.
    await supabase.from("messages").insert({
      chat_id: activeChatId,
      role: "user",
      content: message
    });

    // Panggil Gemini dengan histori + pesan baru.
    const aiReply = await askGemini(history, message);

    // Simpan jawaban AI ke database.
    await supabase.from("messages").insert({
      chat_id: activeChatId,
      role: "assistant",
      content: aiReply
    });

    // Update timestamp terakhir chat, biar sidebar bisa sort by "terbaru".
    await supabase
      .from("chats")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", activeChatId);

    return NextResponse.json({ chatId: activeChatId, reply: aiReply });
  } catch (err: any) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan di server." },
      { status: 500 }
    );
  }
}
