export type Role = "user" | "assistant";

export interface ChatRow {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: string;
  chat_id: string;
  role: Role;
  content: string;
  created_at: string;
}

export interface CodeFile {
  filename: string;
  language: string;
  content: string;
}
