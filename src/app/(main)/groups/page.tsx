"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Plus, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

interface Group {
  id: number;
  group_number: number;
  name: string;
  description: string | null;
  owner_id: number;
  visibility: string;
}

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newVisibility, setNewVisibility] = useState("public");

  const loadGroups = useCallback(async () => {
    const [allRes, myRes] = await Promise.all([
      fetch("/api/groups"),
      fetch("/api/groups?my=true"),
    ]);
    const all = await allRes.json();
    const my = await myRes.json();
    setGroups(all.groups ?? []);
    setMyGroups(my.groups ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  async function handleSearch() {
    if (!searchQuery.trim()) return loadGroups();
    const res = await fetch(`/api/groups?q=${encodeURIComponent(searchQuery)}`);
    const data = await res.json();
    setGroups(data.groups);
  }

  async function handleCreate() {
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        description: newDesc,
        visibility: newVisibility,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      toast.success("群创建成功");
      setDialogOpen(false);
      router.push(`/groups/${data.group.id}`);
    } else {
      toast.error(data.error);
    }
  }

  async function handleJoin(groupId: number) {
    const res = await fetch("/api/groups/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("加入成功");
      loadGroups();
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
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">群聊</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
            <Plus className="h-4 w-4 mr-1" /> 创建群
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建新群</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>群名称</Label>
                <Input
                  placeholder="输入群名称"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>群简介</Label>
                <Input
                  placeholder="选填"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>群类型</Label>
                <Select
                  value={newVisibility}
                  onValueChange={(v) => setNewVisibility(v ?? "public")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">公开群（可搜索加入）</SelectItem>
                    <SelectItem value="invite_only">
                      邀请制（仅邀请加入）
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full">
                创建
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="my">
        <TabsList className="mb-6">
          <TabsTrigger value="my">我的群聊</TabsTrigger>
          <TabsTrigger value="discover">发现群聊</TabsTrigger>
        </TabsList>

        <TabsContent value="my" className="space-y-3">
          {myGroups.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              还没加入任何群
            </p>
          ) : (
            myGroups.map((group) => (
              <Link key={group.id} href={`/groups/${group.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex-1">
                      <p className="font-medium">{group.name}</p>
                      <p className="text-xs text-muted-foreground">
                        群号: {group.group_number}
                        <Badge variant="secondary" className="ml-2">
                          {group.visibility === "public" ? "公开" : "邀请制"}
                        </Badge>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>

        <TabsContent value="discover" className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="搜索群名称或群号"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {groups.map((group) => {
            const isMember = myGroups.some((g) => g.id === group.id);
            return (
              <Card key={group.id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex-1">
                    <p className="font-medium">{group.name}</p>
                    <p className="text-xs text-muted-foreground">
                      群号: {group.group_number}
                      <Badge variant="secondary" className="ml-2">
                        {group.visibility === "public" ? "公开" : "邀请制"}
                      </Badge>
                    </p>
                    {group.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {group.description}
                      </p>
                    )}
                  </div>
                  {isMember ? (
                    <Link href={`/groups/${group.id}`}>
                      <Button size="sm" variant="outline">
                        进入
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleJoin(group.id)}
                      disabled={group.visibility === "invite_only"}
                    >
                      <LogIn className="h-4 w-4 mr-1" />
                      {group.visibility === "invite_only"
                        ? "仅邀请"
                        : "加入"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
