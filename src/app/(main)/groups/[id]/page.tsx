"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useChat } from "@/hooks/use-chat";
import { Send } from "lucide-react";

interface GroupInfo {
  id: number;
  group_number: number;
  name: string;
  owner_id: number;
  visibility: string;
}

export default function GroupChatPage() {
  const params = useParams();
  const groupId = Number(params.id);
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Get current user from session cookie
    fetch("/api/groups")
      .then((r) => r.json())
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function loadGroup() {
      const res = await fetch(`/api/groups?q=${groupId}`);
      const data = await res.json();
      const g = data.groups?.find((g: GroupInfo) => g.group_number === groupId);
      setGroup(g ?? data.groups?.[0]);
    }
    loadGroup();
  }, [groupId]);

  const { messages, loading, sendMessage, bottomRef } = useChat({
    groupId,
    userId: userId ?? undefined,
  });

  async function handleSend() {
    if (!input.trim()) return;
    const ok = await sendMessage(input.trim());
    if (ok) setInput("");
    inputRef.current?.focus();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 py-3">
        <h2 className="font-bold">{group?.name ?? `群聊 #${groupId}`}</h2>
        {group && (
          <p className="text-xs text-muted-foreground">
            群号: {group.group_number}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            暂无消息，开始聊天吧
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${
              msg.sender_id === userId ? "justify-end" : ""
            }`}
          >
            {msg.sender_id !== userId && (
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs">
                  {'U'}
                </AvatarFallback>
              </Avatar>
            )}
            <div
              className={`max-w-[70%] rounded-lg px-3 py-2 ${
                msg.sender_id === userId
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {msg.type === "text" && (
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              )}
              {msg.type === "image" && msg.media_url && (
                <img
                  src={msg.media_url}
                  alt="图片"
                  className="max-w-xs rounded"
                />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3 flex gap-2">
        <Input
          ref={inputRef}
          placeholder="输入消息..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button onClick={handleSend} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
