import { createServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
}

interface IncomingRequest {
  id: string;
  sender_id: string;
  created_at: string;
  type: string;
  sender?: Profile;
}

interface OutgoingRequest {
  id: string;
  receiver_id: string;
  created_at: string;
  type: string;
  receiver?: Profile;
}

// GET - Fetch pending friend requests for the current user
export async function GET() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all pending requests where user is the receiver (incoming)
  const { data: incomingRequests, error } = await supabase
    .from("friend_requests")
    .select("id, sender_id, created_at")
    .eq("receiver_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get all pending requests where user is the sender (outgoing)
  const { data: outgoingRequests, error: outgoingError } = await supabase
    .from("friend_requests")
    .select("id, receiver_id, created_at")
    .eq("sender_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (outgoingError) {
    return NextResponse.json({ error: outgoingError.message }, { status: 500 });
  }

  // Get profiles for incoming requests (senders)
  let incomingWithProfiles: IncomingRequest[] = [];
  if (incomingRequests && incomingRequests.length > 0) {
    const senderIds = incomingRequests.map((r) => r.sender_id);
    const { data: senderProfiles } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", senderIds);

    incomingWithProfiles = incomingRequests.map((req) => ({
      ...req,
      type: "incoming",
      sender: senderProfiles?.find((p) => p.id === req.sender_id),
    }));
  }

  // Get profiles for outgoing requests (receivers)
  let outgoingWithProfiles: OutgoingRequest[] = [];
  if (outgoingRequests && outgoingRequests.length > 0) {
    const receiverIds = outgoingRequests.map((r) => r.receiver_id);
    const { data: receiverProfiles } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", receiverIds);

    outgoingWithProfiles = outgoingRequests.map((req) => ({
      ...req,
      type: "outgoing",
      receiver: receiverProfiles?.find((p) => p.id === req.receiver_id),
    }));
  }

  return NextResponse.json({
    incoming: incomingWithProfiles,
    outgoing: outgoingWithProfiles,
  });
}

// POST - Send a friend request
export async function POST(request: Request) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { receiver_id } = await request.json();

  if (!receiver_id) {
    return NextResponse.json(
      { error: "receiver_id is required" },
      { status: 400 }
    );
  }

  if (receiver_id === user.id) {
    return NextResponse.json(
      { error: "Cannot send friend request to yourself" },
      { status: 400 }
    );
  }

  // Check if friendship already exists
  const { data: existingFriendship } = await supabase
    .from("friendships")
    .select("id")
    .or(
      `and(user_id_1.eq.${user.id < receiver_id ? user.id : receiver_id},user_id_2.eq.${user.id < receiver_id ? receiver_id : user.id})`
    )
    .single();

  if (existingFriendship) {
    return NextResponse.json(
      { error: "Already friends" },
      { status: 400 }
    );
  }

  // Check if request already exists
  const { data: existingRequest } = await supabase
    .from("friend_requests")
    .select("id")
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${receiver_id}),and(sender_id.eq.${receiver_id},receiver_id.eq.${user.id})`
    )
    .single();

  if (existingRequest) {
    return NextResponse.json(
      { error: "Friend request already exists" },
      { status: 400 }
    );
  }

  // Create the friend request
  const { data, error } = await supabase
    .from("friend_requests")
    .insert({
      sender_id: user.id,
      receiver_id: receiver_id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
