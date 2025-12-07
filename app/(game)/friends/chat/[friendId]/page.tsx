"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface Friend {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
}

export default function ChatPage({ params }: { params: { friendId: string } }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [friend, setFriend] = useState<Friend | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  async function loadCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  }

  async function loadFriend() {
    const res = await fetch(`/api/friends`);
    if (res.ok) {
      const friends = await res.json();
      const foundFriend = friends.find((f: Friend) => f.id === params.friendId);
      if (foundFriend) {
        setFriend(foundFriend);
      } else {
        router.push("/friends");
      }
    }
  }

  async function loadMessages() {
    const res = await fetch(`/api/chat?friendId=${params.friendId}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
    }
    setLoading(false);
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function formatTime(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("nl-NL", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }

  useEffect(() => {
    async function fetchInitialData() {
      // Load current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      // Load friend
      const friendsRes = await fetch(`/api/friends`);
      if (friendsRes.ok) {
        const friends = await friendsRes.json();
        const foundFriend = friends.find((f: Friend) => f.id === params.friendId);
        if (foundFriend) {
          setFriend(foundFriend);
        } else {
          router.push("/friends");
        }
      }

      // Load messages
      const messagesRes = await fetch(`/api/chat?friendId=${params.friendId}`);
      if (messagesRes.ok) {
        const data = await messagesRes.json();
        setMessages(data);
      }
      setLoading(false);
    }

    fetchInitialData();

    // Subscribe to new messages
    const channel = supabase
      .channel("chat_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Only add if it's between current user and this friend
          if (
            (newMsg.sender_id === params.friendId || newMsg.receiver_id === params.friendId)
          ) {
            setMessages((prev) => [...prev, newMsg]);
            scrollToBottom();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.friendId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiver_id: params.friendId,
        message: newMessage.trim(),
      }),
    });

    if (res.ok) {
      setNewMessage("");
    } else {
      alert("Failed to send message");
    }
    setSending(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  if (!friend) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Friend not found</p>
          <Link
            href="/friends"
            className="text-yellow-400 hover:text-yellow-500 underline"
          >
            Back to Friends
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link
            href="/friends"
            className="text-yellow-400 hover:text-yellow-500 transition-colors"
          >
            ← Back
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-black font-bold">
              {friend.username[0].toUpperCase()}
            </div>
            <div>
              <div className="font-bold">{friend.username}</div>
              {friend.full_name && (
                <div className="text-sm text-zinc-400">{friend.full_name}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      isMe
                        ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-black"
                        : "bg-zinc-800 text-white"
                    }`}
                  >
                    <div className="break-words">{msg.message}</div>
                    <div
                      className={`text-xs mt-1 ${
                        isMe ? "text-black/70" : "text-zinc-500"
                      }`}
                    >
                      {formatTime(msg.created_at)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-zinc-900 border-t border-zinc-800 p-4 sticky bottom-0">
        <form
          onSubmit={sendMessage}
          className="max-w-4xl mx-auto flex gap-2"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full px-6 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-black font-bold px-6 py-3 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
