import { createServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// GET - Get count of unread messages for each friend
export async function GET() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all unread messages for the current user
  const { data: messages, error } = await supabase
    .from("chat_messages")
    .select("sender_id")
    .eq("receiver_id", user.id)
    .eq("read", false);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Count unread messages per sender
  const unreadCounts: Record<string, number> = {};
  messages?.forEach((msg) => {
    unreadCounts[msg.sender_id] = (unreadCounts[msg.sender_id] || 0) + 1;
  });

  return NextResponse.json(unreadCounts);
}
