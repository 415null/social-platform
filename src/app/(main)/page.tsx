import { getSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        欢迎回来，{session!.username}
      </h1>

      <p className="text-muted-foreground mb-8">
        你的ID: <span className="font-mono font-bold text-foreground">{session!.id}</span>
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">好友</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">管理好友，发起私聊</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">群聊</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">加入群组，群聊互动</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">论坛</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">浏览帖子，参与讨论</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">视频</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">观看视频，点赞收藏</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
