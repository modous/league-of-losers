import { createServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// PATCH - Accept or reject a friend request
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action } = await request.json(); // 'accept' or 'reject'

  if (!action || !["accept", "reject"].includes(action)) {
    return NextResponse.json(
      { error: "Invalid action. Must be 'accept' or 'reject'" },
      { status: 400 }
    );
  }

  // Get the request
  const { data: friendRequest, error: fetchError } = await supabase
    .from("friend_requests")
    .select("*")
    .eq("id", params.id)
    .eq("receiver_id", user.id)
    .eq("status", "pending")
    .single();

  if (fetchError || !friendRequest) {
    return NextResponse.json(
      { error: "Friend request not found" },
      { status: 404 }
    );
  }

  if (action === "accept") {
    // Create friendship
    const user1 = friendRequest.sender_id < user.id ? friendRequest.sender_id : user.id;
    const user2 = friendRequest.sender_id < user.id ? user.id : friendRequest.sender_id;

    const { error: friendshipError } = await supabase
      .from("friendships")
      .insert({
        user_id_1: user1,
        user_id_2: user2,
      });

    if (friendshipError) {
      return NextResponse.json(
        { error: friendshipError.message },
        { status: 500 }
      );
    }
  }

  // Update request status
  const { error: updateError } = await supabase
    .from("friend_requests")
    .update({
      status: action === "accept" ? "accepted" : "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE - Delete/cancel a friend request
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("friend_requests")
    .delete()
    .eq("id", params.id)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
