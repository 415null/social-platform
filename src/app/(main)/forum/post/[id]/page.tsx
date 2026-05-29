"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Send, Heart, Trash2 } from "lucide-react";

interface Post {
  id: number;
  title: string;
  content: string;
  image_urls: string[];
  author_id: number;
  category_id: number;
  views: number;
  created_at: string;
  users: { username: string; avatar_url: string | null };
}

interface Comment {
  id: number;
  content: string;
  author_id: number;
  parent_id: number | null;
  created_at: string;
  users: { username: string; avatar_url: string | null };
}

export default function PostDetailPage() {
  const params = useParams();
  const postId = Number(params.id);
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadPost = useCallback(async () => {
    const res = await fetch(`/api/posts/${postId}`);
    if (res.ok) {
      const data = await res.json();
      setPost(data.post);
      setComments(data.comments ?? []);
    }
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  async function handleComment() {
    if (!newComment.trim()) return;
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityType: "post",
        entityId: postId,
        content: newComment.trim(),
        parentId: replyTo,
      }),
    });
    if (res.ok) {
      toast.success("评论成功");
      setNewComment("");
      setReplyTo(null);
      loadPost();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">帖子不存在</p>
        <Link href="/forum" className="text-primary hover:underline mt-2 block">
          返回论坛
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/forum" className="text-sm text-muted-foreground hover:underline mb-4 block">
        &larr; 返回论坛
      </Link>

      <Card className="mb-6">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
            <span>{post.users?.username}</span>
            <span>·</span>
            <span>{new Date(post.created_at).toLocaleString("zh-CN")}</span>
            <span>·</span>
            <span>{post.views} 次浏览</span>
          </div>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
            {post.content}
          </div>
          {post.image_urls?.length > 0 && (
            <div className="flex gap-2 mt-4">
              {post.image_urls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="max-w-xs rounded max-h-48 object-cover"
                />
              ))}
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <Button
              variant={liked ? "default" : "outline"}
              size="sm"
              onClick={() => setLiked(!liked)}
            >
              <Heart className={`h-4 w-4 mr-1 ${liked ? "fill-current" : ""}`} />
              点赞
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="font-bold mb-4">评论 ({comments.length})</h3>
        <div className="space-y-3 mb-6">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`flex gap-2 ${
                comment.parent_id ? "ml-8 border-l-2 pl-4" : ""
              }`}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs">
                  {comment.users?.username?.slice(0, 2).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {comment.users?.username}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleString("zh-CN")}
                  </span>
                </div>
                <p className="text-sm mt-1">{comment.content}</p>
                <button
                  className="text-xs text-muted-foreground hover:text-primary mt-1"
                  onClick={() => setReplyTo(comment.id)}
                >
                  回复
                </button>
              </div>
            </div>
          ))}
        </div>

        {replyTo && (
          <p className="text-sm text-muted-foreground mb-2">
            回复评论 #
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
            placeholder="写下你的评论..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleComment()}
          />
          <Button onClick={handleComment} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
