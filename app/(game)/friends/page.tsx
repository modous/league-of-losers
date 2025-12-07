"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

interface Friend {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
}

interface FriendRequest {
  id: string;
  sender_id: string;
  created_at: string;
  sender: Friend;
}

interface OutgoingRequest {
  id: string;
  receiver_id: string;
  created_at: string;
  receiver: Friend;
}

interface SearchResult {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<OutgoingRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  async function loadFriends() {
    const res = await fetch("/api/friends");
    if (res.ok) {
      const data = await res.json();
      setFriends(data);
    }
    setLoading(false);
  }

  async function loadRequests() {
    const res = await fetch("/api/friends/requests");
    if (res.ok) {
      const data = await res.json();
      setRequests(data.incoming || []);
      setOutgoingRequests(data.outgoing || []);
    }
  }

  async function loadUnreadCounts() {
    const res = await fetch("/api/chat/unread");
    if (res.ok) {
      const data = await res.json();
      setUnreadCounts(data);
    }
  }

  async function searchUsers() {
    if (searchQuery.length < 2) return;

    setSearching(true);
    const res = await fetch(`/api/friends/search?q=${encodeURIComponent(searchQuery)}`);
    if (res.ok) {
      const data = await res.json();
      setSearchResults(data);
    }
    setSearching(false);
  }

  async function sendFriendRequest(userId: string) {
    const res = await fetch("/api/friends/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiver_id: userId }),
    });

    if (res.ok) {
      alert("Friend request sent!");
      setSearchQuery("");
      setSearchResults([]);
    } else {
      const error = await res.json();
      alert(error.error || "Failed to send friend request");
    }
  }

  async function handleRequest(requestId: string, action: "accept" | "reject") {
    const res = await fetch(`/api/friends/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (res.ok) {
      setRequests(requests.filter((r) => r.id !== requestId));
      if (action === "accept") {
        loadFriends();
      }
    }
  }

  async function cancelRequest(requestId: string) {
    const res = await fetch(`/api/friends/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject" }),
    });

    if (res.ok) {
      setOutgoingRequests(outgoingRequests.filter((r) => r.id !== requestId));
    }
  }

  useEffect(() => {
    async function fetchInitialData() {
      // Fetch friends
      const friendsRes = await fetch("/api/friends");
      if (friendsRes.ok) {
        const friendsData = await friendsRes.json();
        setFriends(friendsData);
      }
      
      // Fetch requests
      const requestsRes = await fetch("/api/friends/requests");
      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setRequests(requestsData.incoming || []);
        setOutgoingRequests(requestsData.outgoing || []);
      }
      
      // Fetch unread counts
      const unreadRes = await fetch("/api/chat/unread");
      if (unreadRes.ok) {
        const unreadData = await unreadRes.json();
        setUnreadCounts(unreadData);
      }
      
      setLoading(false);
    }
    
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(async () => {
        setSearching(true);
        const res = await fetch(`/api/friends/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
        setSearching(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-black mb-8 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
          Friends
        </h1>

        {/* Search Users */}
        <div className="mb-8 bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <h2 className="text-xl font-bold mb-4 text-yellow-400">
            Find Friends
          </h2>
          <input
            type="text"
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => {
              const value = e.target.value;
              setSearchQuery(value);
              if (value.length < 2) {
                setSearchResults([]);
              }
            }}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />

          {searching && (
            <div className="text-center py-4 text-zinc-400">Searching...</div>
          )}

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between bg-zinc-800 p-4 rounded-lg"
                >
                  <div>
                    <div className="font-semibold">{user.username}</div>
                    {user.full_name && (
                      <div className="text-sm text-zinc-400">{user.full_name}</div>
                    )}
                  </div>
                  <button
                    onClick={() => sendFriendRequest(user.id)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Add Friend
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Incoming Friend Requests */}
        {requests.length > 0 && (
          <div className="mb-8 bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-xl font-bold mb-4 text-yellow-400">
              Incoming Friend Requests ({requests.length})
            </h2>
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between bg-zinc-800 p-4 rounded-lg"
                >
                  <div>
                    <div className="font-semibold">{request.sender.username}</div>
                    {request.sender.full_name && (
                      <div className="text-sm text-zinc-400">
                        {request.sender.full_name}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRequest(request.id, "accept")}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRequest(request.id, "reject")}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outgoing Friend Requests */}
        {outgoingRequests.length > 0 && (
          <div className="mb-8 bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-xl font-bold mb-4 text-orange-400">
              Pending Requests ({outgoingRequests.length})
            </h2>
            <div className="space-y-3">
              {outgoingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between bg-zinc-800 p-4 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full flex items-center justify-center text-black font-bold">
                      {request.receiver.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold">{request.receiver.username}</div>
                      {request.receiver.full_name && (
                        <div className="text-sm text-zinc-400">
                          {request.receiver.full_name}
                        </div>
                      )}
                      <div className="text-xs text-orange-400 mt-1">Waiting for response...</div>
                    </div>
                  </div>
                  <button
                    onClick={() => cancelRequest(request.id)}
                    className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <h2 className="text-xl font-bold mb-4 text-yellow-400">
            My Friends ({friends.length})
          </h2>

          {friends.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              No friends yet. Search for users above to add friends!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map((friend) => (
                <Link
                  key={friend.id}
                  href={`/friends/chat/${friend.id}`}
                  className="bg-zinc-800 hover:bg-zinc-700 p-4 rounded-lg transition-colors group relative"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-black font-bold text-lg">
                      {friend.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{friend.username}</div>
                      {friend.full_name && (
                        <div className="text-sm text-zinc-400 truncate">
                          {friend.full_name}
                        </div>
                      )}
                    </div>
                    {unreadCounts[friend.id] > 0 && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {unreadCounts[friend.id]}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-sm text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to chat →
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
