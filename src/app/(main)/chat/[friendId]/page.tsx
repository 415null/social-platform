"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useChat } from "@/hooks/use-chat";
import { ImageUpload } from "@/components/upload/image-upload";
import { ArrowLeft, Send } from "lucide-react";

export default function DMChatPage() {
  const params = useParams();
  const router = useRouter();
  const friendId = Number(params.friendId);
  const [friend, setFriend] = useState<{ username: string } | null>(null);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      // Get friend info from friends API
      const res = await fetch("/api/friends");
      const data = await res.json();
      const found = data.friends.find(
        (f: { id: number; username: string }) => f.id === friendId,
      );
      setFriend(found ?? { username: `用户${friendId}` });
    }
    load();
  }, [friendId]);

  const { messages, loading, sendMessage, bottomRef } = useChat({
    friendId,
  });

  async function handleSend() {
    if (!input.trim()) return;
    const ok = await sendMessage(input.trim());
    if (ok) setInput("");
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="font-bold">{friend?.username}</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <p className="text-center text-muted-foreground py-12">加载中...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            开始聊天吧
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${
                msg.sender_id === friendId ? "" : "justify-end"
              }`}
            >
              {msg.sender_id === friendId && (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs">
                    {friend?.username?.slice(0, 2).toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[70%] rounded-lg px-3 py-2 ${
                  msg.sender_id !== friendId
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
                {(() => {
                  if (msg.type !== "forward" || !msg.forward_ref) return null;
                  const ref = msg.forward_ref as Record<string, unknown>;
                  const refType = String(ref.type ?? "");
                  const refTitle = String(ref.entityTitle ?? "");
                  return (
                    <div className="border rounded p-2 text-left">
                      <p className="text-xs font-medium">
                        分享了{refType === "video" ? "视频" : "帖子"}
                      </p>
                      <p className="text-xs opacity-80">{refTitle}</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3 flex gap-2 items-center">
        <ImageUpload
          bucket="chat-images"
          onUploaded={async (url) => {
            await fetch("/api/messages", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                receiverId: friendId,
                type: "image",
                mediaUrl: url,
              }),
            });
          }}
        />
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
