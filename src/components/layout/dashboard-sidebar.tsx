"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  FolderOpen,
  Settings,
  LogOut,
  PenTool,
  Crown,
  Sparkles,
} from "lucide-react";
import { signOut } from "next-auth/react";
import type { User } from "next-auth";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  user: User;
  tier: "free" | "pro" | "team";
}

export function DashboardSidebar({ user, tier }: DashboardSidebarProps) {
  const pathname = usePathname();

  const navigation = [
    {
      name: "Projects",
      href: "/projects",
      icon: FolderOpen,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  const tierBadge = {
    free: { label: "FREE", bg: "bg-gray-200", text: "text-gray-700" },
    pro: { label: "PRO", bg: "bg-brutal-yellow", text: "text-black" },
    team: { label: "TEAM", bg: "bg-brutal-blue", text: "text-white" },
  };

  const badge = tierBadge[tier];

  return (
    <aside className="flex w-64 flex-col border-r-4 border-black bg-white">
      {/* Logo */}
      <div className="border-b-4 border-black p-6">
        <Link
          href="/"
          className="flex items-center gap-3 text-2xl font-black tracking-tight text-black"
        >
          <div className="flex h-10 w-10 items-center justify-center border-3 border-black bg-brutal-yellow">
            <PenTool className="h-5 w-5" />
          </div>
          Inkwell
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 border-3 px-4 py-3 font-bold transition-all",
                    isActive
                      ? "border-black bg-brutal-yellow shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                      : "border-transparent text-gray-700 hover:border-black hover:bg-gray-50"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info */}
      <div className="border-t-4 border-black p-4">
        <div className="mb-4 flex items-center gap-3">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? "User avatar"}
              width={44}
              height={44}
              className="border-3 border-black"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center border-3 border-black bg-gray-200 font-bold">
              {user.name?.charAt(0) ?? "U"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-black">{user.name}</p>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1 border-2 border-black px-1.5 py-0.5 text-[10px] font-bold",
                  badge.bg,
                  badge.text
                )}
              >
                {tier !== "free" && <Crown className="h-3 w-3" />}
                {badge.label}
              </span>
            </div>
          </div>
        </div>

        {/* Upgrade CTA for Free users */}
        {tier === "free" && (
          <Link
            href="/settings"
            className="mb-4 flex w-full items-center justify-center gap-2 border-3 border-black bg-brutal-pink px-4 py-2 font-bold text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <Sparkles className="h-4 w-4" />
            Upgrade
          </Link>
        )}

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-2 border-3 border-black bg-white px-4 py-2 font-bold text-black transition-all hover:bg-brutal-red hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
