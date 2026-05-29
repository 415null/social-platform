"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

interface Post {
  id: number;
  title: string;
  content: string;
  author_id: number;
  category_id: number;
  views: number;
  created_at: string;
  users: { username: string; avatar_url: string | null };
}

export default function ForumPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    async function load() {
      const [catRes, postRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/posts"),
      ]);
      const cats = await catRes.json();
      const pts = await postRes.json();
      setCategories(cats.categories ?? []);
      setPosts(pts.posts ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleCreatePost() {
    if (!newTitle || !newContent || !selectedCategory) {
      toast.error("请填写完整信息");
      return;
    }
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle,
        content: newContent,
        categoryId: Number(selectedCategory),
      }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("发帖成功");
      setDialogOpen(false);
      setPosts((prev) => [data.post as Post, ...prev]);
      setNewTitle("");
      setNewContent("");
    } else {
      toast.error(data.error);
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
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">论坛</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
            <Plus className="h-4 w-4" /> 发帖
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>发布新帖</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>板块</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={(v) => setSelectedCategory(v ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择板块" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>标题</Label>
                <Input
                  placeholder="帖子标题"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>内容</Label>
                <Textarea
                  placeholder="帖子内容..."
                  rows={6}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                />
              </div>
              <Button onClick={handleCreatePost} className="w-full">
                发布
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {categories.map((cat) => (
          <Link key={cat.id} href={`/forum/${cat.slug}`}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <p className="font-medium">{cat.name}</p>
                {cat.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {cat.description}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <h2 className="font-bold mb-4 text-lg">最新帖子</h2>
      <div className="space-y-3">
        {posts.map((post) => (
          <Link key={post.id} href={`/forum/post/${post.id}`}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <p className="font-medium">{post.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {post.content}
                </p>
                <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                  <span>{post.users?.username}</span>
                  <span>{post.views} 次浏览</span>
                  <span>{new Date(post.created_at).toLocaleDateString("zh-CN")}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
