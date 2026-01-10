"use client";

import Image from "next/image";
import { Bell, Search } from "lucide-react";
import type { User } from "next-auth";

interface DashboardHeaderProps {
  user: User;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b-4 border-black bg-white px-6">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full border-4 border-black py-2 pl-10 pr-4 font-medium text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative border-4 border-black p-2 transition-all hover:bg-gray-50"
        >
          <Bell className="h-5 w-5 text-black" />
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center bg-yellow-400 text-xs font-bold text-black">
            3
          </span>
        </button>

        {user.image && (
          <Image
            src={user.image}
            alt={user.name ?? "User avatar"}
            width={40}
            height={40}
            className="border-4 border-black"
          />
        )}
      </div>
    </header>
  );
}
