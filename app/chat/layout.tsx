import { createClient } from "@/lib/supabase/server";
import ChatLayoutClient from "@/components/ChatLayoutClient";

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: chats } = await supabase
    .from("chats")
    .select("*")
    .order("updated_at", { ascending: false });

  return (
    <ChatLayoutClient
      user={{
        email: user?.email ?? "",
        name: (user?.user_metadata?.full_name as string) || (user?.user_metadata?.name as string) || user?.email?.split("@")[0] || "User",
        avatarUrl: (user?.user_metadata?.avatar_url as string) || null
      }}
      chats={chats || []}
    >
      {children}
    </ChatLayoutClient>
  );
}
