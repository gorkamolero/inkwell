"use client";

import Image from "next/image";
import { useState } from "react";
import type { User } from "@/types";

interface SettingsFormProps {
  user: User;
}

export function SettingsForm({ user }: SettingsFormProps) {
  const [name, setName] = useState(user.name ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // TODO: Implement update profile action
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="mb-2 block font-bold text-black">
          Display Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border-4 border-black px-4 py-2 font-medium text-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-2 block font-bold text-black">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={user.email ?? ""}
          disabled
          className="w-full border-4 border-gray-300 bg-gray-100 px-4 py-2 font-medium text-gray-500"
        />
        <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
      </div>

      <div className="flex items-center gap-4">
        {user.image && (
          <Image
            src={user.image}
            alt="Profile"
            width={64}
            height={64}
            className="border-4 border-black"
          />
        )}
        <div>
          <p className="font-bold text-black">Profile Picture</p>
          <p className="text-sm text-gray-700">
            Managed by your OAuth provider
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="border-4 border-black bg-yellow-400 px-6 py-2 font-bold text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
