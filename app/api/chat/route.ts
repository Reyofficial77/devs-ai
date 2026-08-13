import { createClient } from "@/lib/supabase/server";
import { askGeminiStream, type GeminiHistoryItem } from "@/lib/gemini";
import type { MessageRow } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Belum login." }, { status: 401 });
  }

  const body = await request.json();
  const { message, chatId } = body as { message: string; chatId: string | null };

  if (!message || !message.trim()) {
    return Response.json({ error: "Pesan kosong." }, { status: 400 });
  }

  let activeChatId = chatId;

  try {
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

    const geminiStream = askGeminiStream(history, message);
    const finalChatId = activeChatId;
    let fullText = "";

    // Streaming body: tiap chunk dari Gemini langsung diteruskan ke client
    // begitu diterima, supaya muncul efek AI mengetik secara real-time.
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of geminiStream) {
            fullText += chunk;
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (err: any) {
          console.error("Gemini stream error:", err);
          const fallback = "\n\n_(Terjadi gangguan saat menghasilkan jawaban. Coba kirim ulang pesan kamu.)_";
          fullText += fallback;
          controller.enqueue(encoder.encode(fallback));
        } finally {
          // Simpan jawaban AI lengkap ke database setelah stream selesai.
          if (fullText.trim()) {
            await supabase.from("messages").insert({
              chat_id: finalChatId,
              role: "assistant",
              content: fullText
            });
          }
          await supabase
            .from("chats")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", finalChatId);

          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Chat-Id": activeChatId as string,
        "Cache-Control": "no-cache"
      }
    });
  } catch (err: any) {
    console.error("Chat API error:", err);
    return Response.json(
      { error: err.message || "Terjadi kesalahan di server." },
      { status: 500 }
    );
  }
}
