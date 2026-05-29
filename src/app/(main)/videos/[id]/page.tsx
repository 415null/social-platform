"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Heart, Bookmark, Send, Share2 } from "lucide-react";

interface VideoDetail {
  video: {
    id: number;
    title: string;
    description: string;
    video_url: string;
    thumbnail_url: string | null;
    duration: number | null;
    author_id: number;
    likes_count: number;
    favorites_count: number;
    comments_count: number;
    views: number;
    created_at: string;
    users: { username: string; avatar_url: string | null };
  };
  isLiked: boolean;
  isFavorited: boolean;
  comments: Comment[];
}

interface Comment {
  id: number;
  content: string;
  author_id: number;
  parent_id: number | null;
  created_at: string;
  users: { username: string; avatar_url: string | null };
}

export default function VideoDetailPage() {
  const params = useParams();
  const videoId = Number(params.id);
  const [data, setData] = useState<VideoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/videos/${videoId}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [videoId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAction(action: string) {
    await fetch(`/api/videos/${videoId}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    load();
  }

  async function handleComment() {
    if (!comment.trim()) return;
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityType: "video",
        entityId: videoId,
        content: comment.trim(),
        parentId: replyTo,
      }),
    });
    if (res.ok) {
      toast.success("评论成功");
      setComment("");
      setReplyTo(null);
      load();
    }
  }

  function handleShare() {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("链接已复制");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">视频不存在</p>
        <Link href="/videos" className="text-primary hover:underline mt-2 block">
          返回视频列表
        </Link>
      </div>
    );
  }

  const { video, isLiked, isFavorited, comments } = data;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="bg-black aspect-video relative">
          <video
            src={video.video_url}
            controls
            className="w-full h-full"
            poster={video.thumbnail_url ?? undefined}
          />
        </div>

        <div className="p-6 max-w-3xl mx-auto">
          <h1 className="text-xl font-bold mb-2">{video.title}</h1>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              {video.views} 次观看
            </span>
            <span>{new Date(video.created_at).toLocaleString("zh-CN")}</span>
          </div>

          <div className="flex items-center gap-3 my-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {video.users?.username?.slice(0, 2).toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{video.users?.username}</p>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <Button
              variant={isLiked ? "default" : "outline"}
              size="sm"
              onClick={() => handleAction(isLiked ? "unlike" : "like")}
            >
              <Heart
                className={`h-4 w-4 mr-1 ${isLiked ? "fill-current" : ""}`}
              />
              点赞 {video.likes_count}
            </Button>
            <Button
              variant={isFavorited ? "default" : "outline"}
              size="sm"
              onClick={() =>
                handleAction(isFavorited ? "unfavorite" : "favorite")
              }
            >
              <Bookmark
                className={`h-4 w-4 mr-1 ${isFavorited ? "fill-current" : ""}`}
              />
              收藏 {video.favorites_count}
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1" />
              分享
            </Button>
          </div>

          {video.description && (
            <div className="bg-muted rounded-lg p-4 mb-6">
              <p className="text-sm whitespace-pre-wrap">{video.description}</p>
            </div>
          )}

          <Separator className="my-6" />

          <h3 className="font-bold mb-4">
            评论 ({comments.length})
          </h3>
          <div className="space-y-3 mb-6">
            {comments.map((c) => (
              <div
                key={c.id}
                className={`flex gap-2 ${
                  c.parent_id ? "ml-8 border-l-2 pl-4" : ""
                }`}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs">
                    {c.users?.username?.slice(0, 2).toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {c.users?.username}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleString("zh-CN")}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{c.content}</p>
                  <button
                    className="text-xs text-muted-foreground hover:text-primary mt-1"
                    onClick={() => setReplyTo(c.id)}
                  >
                    回复
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t bg-background p-4">
        <div className="max-w-3xl mx-auto">
          {replyTo && (
            <p className="text-sm text-muted-foreground mb-2">
              回复 #
              {comments.find((c) => c.id === replyTo)?.users?.username ?? replyTo}
              <button
                className="ml-2 text-primary"
                onClick={() => setReplyTo(null)}
              >
                取消
              </button>
            </p>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="发条评论..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleComment()}
            />
            <Button onClick={handleComment} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
