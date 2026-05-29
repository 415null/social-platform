"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, Play, Heart, Bookmark, MessageCircle } from "lucide-react";

interface Video {
  id: number;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  author_id: number;
  likes_count: number;
  favorites_count: number;
  comments_count: number;
  views: number;
  created_at: string;
  users: { username: string; avatar_url: string | null };
}

export default function VideosPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/videos");
      const data = await res.json();
      setVideos(data.videos ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleUpload() {
    if (!title || !videoUrl) {
      toast.error("请填写标题和视频链接");
      return;
    }
    const res = await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, videoUrl, thumbnailUrl }),
    });
    if (res.ok) {
      toast.success("上传成功");
      setDialogOpen(false);
      const data = await res.json();
      router.push(`/videos/${data.video.id}`);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">视频</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
            <Upload className="h-4 w-4" /> 上传视频
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>上传视频</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>标题</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>简介</Label>
                <Textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>视频URL</Label>
                <Input
                  placeholder="Supabase Storage URL"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>封面图URL</Label>
                <Input
                  placeholder="可选"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                />
              </div>
              <Button onClick={handleUpload} className="w-full">
                上传
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <Link key={video.id} href={`/videos/${video.id}`}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center relative">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                ) : (
                  <Play className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <CardContent className="p-3">
                <p className="font-medium line-clamp-2">{video.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {video.users?.username}
                </p>
                <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Play className="h-3 w-3" /> {video.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" /> {video.likes_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />{" "}
                    {video.comments_count}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
