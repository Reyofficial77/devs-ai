import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChatView from "@/components/ChatView";

export default async function ChatPage({ params }: { params: { chatId: string } }) {
  const supabase = createClient();

  // RLS (Row Level Security) di Supabase otomatis memastikan user cuma bisa
  // baca chat miliknya sendiri. Kalau chat tidak ada / bukan punya user ini,
  // query di bawah akan kosong.
  const { data: chat } = await supabase
    .from("chats")
    .select("id")
    .eq("id", params.chatId)
    .single();

  if (!chat) {
    notFound();
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", params.chatId)
    .order("created_at", { ascending: true });

  return <ChatView chatId={params.chatId} initialMessages={messages || []} />;
}
