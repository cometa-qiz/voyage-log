"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useSoundContext } from "@/components/SoundProvider";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const { muted, toggleMute } = useSoundContext();

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
    <header>
      <div className="title-block">
        <h1>作業の航海日誌</h1>
        <span className="subtitle">{"SHIP'S LOG — CHART No.1"}</span>
      </div>
      <div className="header-actions">
        <button type="button" onClick={toggleMute} className="btn-ghost">
          {muted ? "🔇 消音" : "🔊 音"}
        </button>
        <button type="button" onClick={handleSignOut} className="btn-ghost">
          サインアウト
        </button>
      </div>
    </header>
  );
}
