"use client";

import { useEffect, useState } from "react";
import { Bell, UserPlus, MessageCircle, Flame, Check, X } from "lucide-react";
import Link from "next/link";

interface FriendRequest {
  id: string;
  sender_id: string;
  created_at: string;
  sender: {
    username: string;
    avatar_url: string | null;
  };
}

interface UnreadMessage {
  sender_id: string;
  username: string;
  avatar_url: string | null;
  count: number;
  created_at: string;
}

interface Streak {
  user_id: string;
  username: string;
  avatar_url: string | null;
  streak: number;
  last_date: string;
}

interface NotificationsData {
  friendRequests: FriendRequest[];
  unreadMessages: UnreadMessage[];
  streaks: Streak[];
}

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState<NotificationsData>({
    friendRequests: [],
    unreadMessages: [],
    streaks: []
  });
  const [loading, setLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFriendRequest = async (requestId: string, action: "accept" | "reject") => {
    setProcessingRequest(requestId);
    try {
      const res = await fetch(`/api/friends/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });

      if (res.ok) {
        // Remove the request from the list
        setNotifications(prev => ({
          ...prev,
          friendRequests: prev.friendRequests.filter(req => req.id !== requestId)
        }));
      }
    } catch (error) {
      console.error("Error handling friend request:", error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const totalNotifications = 
    notifications.friendRequests.length + 
    notifications.unreadMessages.length + 
    notifications.streaks.length;

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-zinc-900/50 to-black/50 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm animate-pulse">
        <div className="h-6 bg-zinc-800 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-zinc-800 rounded"></div>
          <div className="h-16 bg-zinc-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (totalNotifications === 0) {
    return (
      <div className="bg-gradient-to-br from-zinc-900/50 to-black/50 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="text-yellow-400" size={24} />
          <h2 className="text-2xl font-bold text-white">Notificaties</h2>
        </div>
        <p className="text-slate-400 text-center py-8">Geen nieuwe notificaties</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-zinc-900/50 to-black/50 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="text-yellow-400" size={24} />
        <h2 className="text-2xl font-bold text-white">Notificaties</h2>
        {totalNotifications > 0 && (
          <span className="ml-auto bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">
            {totalNotifications}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {/* Friend Requests */}
        {notifications.friendRequests.map((request) => (
          <div
            key={request.id}
            className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 hover:bg-blue-500/20 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <UserPlus className="text-blue-400" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium">
                  <span className="text-blue-400">{request.sender.username}</span> wil vrienden worden
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(request.created_at).toLocaleDateString('nl-NL', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleFriendRequest(request.id, "accept")}
                    disabled={processingRequest === request.id}
                    className="flex items-center gap-1 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Check size={16} />
                    Accepteren
                  </button>
                  <button
                    onClick={() => handleFriendRequest(request.id, "reject")}
                    disabled={processingRequest === request.id}
                    className="flex items-center gap-1 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <X size={16} />
                    Weigeren
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Unread Messages */}
        {notifications.unreadMessages.map((message) => (
          <Link
            key={message.sender_id}
            href={`/friends/chat/${message.sender_id}`}
            className="block bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 hover:bg-purple-500/20 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <MessageCircle className="text-purple-400" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium">
                  <span className="text-purple-400">{message.username}</span> heeft je een bericht gestuurd
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {message.count} ongelezen bericht{message.count !== 1 ? 'en' : ''}
                </p>
              </div>
            </div>
          </Link>
        ))}

        {/* Friend Streaks */}
        {notifications.streaks.map((streak) => (
          <div
            key={streak.user_id}
            className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 hover:bg-orange-500/20 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Flame className="text-orange-400" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium">
                  <span className="text-orange-400">{streak.username}</span> zit op een {streak.streak} dagen streak! 🔥
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Laatste workout: {new Date(streak.last_date).toLocaleDateString('nl-NL', {
                    day: 'numeric',
                    month: 'long'
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
