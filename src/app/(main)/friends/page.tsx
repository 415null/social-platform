"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, UserPlus, UserX } from "lucide-react";

interface User {
  id: number;
  username: string;
  avatar_url: string | null;
}

interface FriendRequest {
  id: number;
  user: User;
  created_at: string;
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<User[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const res = await fetch("/api/friends");
    const data = await res.json();
    setFriends(data.friends ?? []);
    setIncoming(data.incoming ?? []);
    setOutgoing(data.outgoing ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    const res = await fetch(`/api/users?q=${encodeURIComponent(searchQuery)}`);
    const data = await res.json();
    setSearchResults(data.users ?? []);
  }

  async function handleSendRequest(userId: number) {
    const res = await fetch("/api/friends/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("好友请求已发送");
      loadData();
    } else {
      toast.error(data.error);
    }
  }

  async function handleAccept(requestId: number) {
    const res = await fetch("/api/friends/request", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action: "accepted" }),
    });
    if (res.ok) {
      toast.success("已添加好友");
      loadData();
    }
  }

  async function handleReject(requestId: number) {
    const res = await fetch("/api/friends/request", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action: "rejected" }),
    });
    if (res.ok) {
      toast.success("已拒绝");
      loadData();
    }
  }

  async function handleRemoveFriend(friendId: number) {
    const res = await fetch("/api/friends", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendId }),
    });
    if (res.ok) {
      toast.success("已删除好友");
      loadData();
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
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">好友</h1>

      <Tabs defaultValue="friends">
        <TabsList className="mb-6">
          <TabsTrigger value="friends">
            我的好友 ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            好友请求
            {incoming.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {incoming.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="add">添加好友</TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-3">
          {friends.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              还没有好友，去添加吧
            </p>
          ) : (
            friends.map((friend) => (
              <Card key={friend.id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {friend.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{friend.username}</p>
                    <p className="text-xs text-muted-foreground">
                      ID: {friend.id}
                    </p>
                  </div>
                  <Link href={`/chat/${friend.id}`}>
                    <Button variant="outline" size="sm">
                      私聊
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFriend(friend.id)}
                  >
                    <UserX className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          {incoming.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">收到的请求</h3>
              {incoming.map((req) => (
                <Card key={req.id} className="mb-2">
                  <CardContent className="flex items-center gap-3 p-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {req.user?.username?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{req.user?.username}</p>
                      <p className="text-xs text-muted-foreground">
                        ID: {req.user?.id}
                      </p>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleAccept(req.id)}
                    >
                      同意
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(req.id)}
                    >
                      拒绝
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {outgoing.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">发出的请求</h3>
              {outgoing.map((req) => (
                <Card key={req.id} className="mb-2">
                  <CardContent className="flex items-center gap-3 p-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {req.user?.username?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{req.user?.username}</p>
                      <p className="text-xs text-muted-foreground">等待对方同意</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {incoming.length === 0 && outgoing.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              暂无好友请求
            </p>
          )}
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="输入ID号或用户名搜索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {searchResults.map((user) => (
            <Card key={user.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{user.username}</p>
                  <p className="text-xs text-muted-foreground">
                    ID: {user.id}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleSendRequest(user.id)}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  添加
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
