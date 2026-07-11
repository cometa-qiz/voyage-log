"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  if (!user) {
    return null;
  }

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <header className="flex items-center justify-end gap-4 border-b border-black/[.08] bg-white px-4 py-3 dark:border-white/[.145] dark:bg-zinc-900">
      <button
        type="button"
        onClick={handleSignOut}
        className="rounded-full border border-black/[.08] px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-[#1a1a1a]"
      >
        サインアウト
      </button>
    </header>
  );
}
