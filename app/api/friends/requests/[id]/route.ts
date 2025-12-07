import { createServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// PATCH - Accept or reject a friend request
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🔵 [PATCH /api/friends/requests/[id]] Starting...');
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log('👤 [PATCH] User:', user?.id);

  if (!user) {
    console.log('❌ [PATCH] Unauthorized - no user');
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action } = await request.json(); // 'accept' or 'reject'
  const { id } = await params;

  console.log('📋 [PATCH] Request ID:', id, 'Action:', action);

  if (!action || !["accept", "reject"].includes(action)) {
    console.log('❌ [PATCH] Invalid action:', action);
    return NextResponse.json(
      { error: "Invalid action. Must be 'accept' or 'reject'" },
      { status: 400 }
    );
  }

  // Get the request (allow both sender and receiver)
  console.log('🔍 [PATCH] Fetching friend request...');
  const { data: friendRequest, error: fetchError } = await supabase
    .from("friend_requests")
    .select("*")
    .eq("id", id)
    .eq("status", "pending")
    .single();

  console.log('📊 [PATCH] Friend request:', friendRequest, 'Error:', fetchError);

  if (fetchError || !friendRequest) {
    console.log('❌ [PATCH] Friend request not found');
    return NextResponse.json(
      { error: "Friend request not found" },
      { status: 404 }
    );
  }

  // Only receiver can accept, but both can reject (cancel)
  if (action === "accept" && friendRequest.receiver_id !== user.id) {
    console.log('❌ [PATCH] User is not receiver. Receiver:', friendRequest.receiver_id, 'User:', user.id);
    return NextResponse.json(
      { error: "Only receiver can accept request" },
      { status: 403 }
    );
  }

  // Check if user is either sender or receiver
  if (friendRequest.sender_id !== user.id && friendRequest.receiver_id !== user.id) {
    console.log('❌ [PATCH] User is neither sender nor receiver');
    return NextResponse.json(
      { error: "Unauthorized to modify this request" },
      { status: 403 }
    );
  }

  if (action === "accept") {
    console.log('✅ [PATCH] Creating friendship...');
    // Create friendship
    const user1 = friendRequest.sender_id < user.id ? friendRequest.sender_id : user.id;
    const user2 = friendRequest.sender_id < user.id ? user.id : friendRequest.sender_id;

    console.log('👥 [PATCH] Friendship between:', user1, 'and', user2);

    const { error: friendshipError } = await supabase
      .from("friendships")
      .insert({
        user_id_1: user1,
        user_id_2: user2,
      });

    if (friendshipError) {
      console.log('❌ [PATCH] Friendship creation error:', friendshipError);
      return NextResponse.json(
        { error: friendshipError.message },
        { status: 500 }
      );
    }
    console.log('✅ [PATCH] Friendship created successfully');
  }

  // Update request status
  console.log('🔄 [PATCH] Updating request status to:', action === "accept" ? "accepted" : "rejected");
  const { error: updateError } = await supabase
    .from("friend_requests")
    .update({
      status: action === "accept" ? "accepted" : "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    console.log('❌ [PATCH] Update error:', updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  console.log('✅ [PATCH] Request updated successfully');
  return NextResponse.json({ success: true });
}

// DELETE - Delete/cancel a friend request
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { error } = await supabase
    .from("friend_requests")
    .delete()
    .eq("id", id)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
