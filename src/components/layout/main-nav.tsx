"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, MessageCircle, FileText, Video } from "lucide-react";

const navItems = [
  { href: "/", label: "首页", icon: Home },
  { href: "/friends", label: "好友", icon: Users },
  { href: "/groups", label: "群聊", icon: MessageCircle },
  { href: "/forum", label: "论坛", icon: FileText },
  { href: "/videos", label: "视频", icon: Video },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            prefetch
            className={`inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <item.icon className="h-5 w-5" />
          </Link>
        );
      })}
    </nav>
  );
}
