import { createServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// GET - Fetch chat messages between current user and a friend
export async function GET(request: Request) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const friendId = searchParams.get("friendId");

  if (!friendId) {
    return NextResponse.json(
      { error: "friendId is required" },
      { status: 400 }
    );
  }

  // Fetch messages between the two users
  const { data: messages, error } = await supabase
    .from("chat_messages")
    .select("*")
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`
    )
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mark messages as read
  const unreadMessageIds = messages
    ?.filter((m) => m.receiver_id === user.id && !m.read)
    .map((m) => m.id) || [];

  if (unreadMessageIds.length > 0) {
    await supabase
      .from("chat_messages")
      .update({ read: true })
      .in("id", unreadMessageIds);
  }

  return NextResponse.json(messages || []);
}

// POST - Send a chat message
export async function POST(request: Request) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { receiver_id, message } = await request.json();

  if (!receiver_id || !message) {
    return NextResponse.json(
      { error: "receiver_id and message are required" },
      { status: 400 }
    );
  }

  if (message.trim().length === 0) {
    return NextResponse.json(
      { error: "Message cannot be empty" },
      { status: 400 }
    );
  }

  // Verify friendship exists
  const user1 = user.id < receiver_id ? user.id : receiver_id;
  const user2 = user.id < receiver_id ? receiver_id : user.id;

  const { data: friendship } = await supabase
    .from("friendships")
    .select("id")
    .eq("user_id_1", user1)
    .eq("user_id_2", user2)
    .single();

  if (!friendship) {
    return NextResponse.json(
      { error: "You must be friends to send messages" },
      { status: 403 }
    );
  }

  // Create the message
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      sender_id: user.id,
      receiver_id: receiver_id,
      message: message.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
