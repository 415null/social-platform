"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

interface Message {
  id: number;
  group_id: number | null;
  sender_id: number;
  receiver_id: number | null;
  type: string;
  content: string | null;
  media_url: string | null;
  forward_ref: unknown;
  created_at: string;
}

export function useChat({
  groupId,
  friendId,
  userId,
}: {
  groupId?: number;
  friendId?: number;
  userId?: number;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    const params = new URLSearchParams();
    if (groupId) params.set("groupId", String(groupId));
    if (friendId) params.set("friendId", String(friendId));

    const res = await fetch(`/api/messages?${params}`);
    const data = await res.json();
    setMessages(data.messages ?? []);
    setLoading(false);
  }, [groupId, friendId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Supabase Realtime subscription
  useEffect(() => {
    if (!groupId && !friendId) return;

    const supabase = createBrowserClient();

    const channel = supabase
      .channel(`chat-${groupId ?? `dm-${friendId}`}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: groupId
            ? `group_id=eq.${groupId}`
            : `sender_id=eq.${userId},receiver_id=eq.${friendId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, friendId, userId]);

  const sendMessage = useCallback(
    async (content: string, type = "text") => {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: groupId ?? null,
          receiverId: friendId ?? null,
          type,
          content,
        }),
      });
      return res.ok;
    },
    [groupId, friendId],
  );

  return { messages, loading, sendMessage, bottomRef };
}
