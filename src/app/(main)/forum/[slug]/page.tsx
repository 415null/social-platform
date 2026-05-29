"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

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

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [catRes] = await Promise.all([
        fetch("/api/categories"),
      ]);
      const cats = await catRes.json();
      const category = cats.categories.find(
        (c: { slug: string }) => c.slug === slug,
      );
      if (category) {
        const res = await fetch(`/api/posts?categoryId=${category.id}`);
        const data = await res.json();
        setPosts(data.posts ?? []);
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/forum" className="text-sm text-muted-foreground hover:underline mb-4 block">
        &larr; 返回论坛
      </Link>
      <h1 className="text-2xl font-bold mb-6 capitalize">{slug}</h1>
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
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {posts.length === 0 && (
          <p className="text-muted-foreground text-center py-12">暂无帖子</p>
        )}
      </div>
    </div>
  );
}
