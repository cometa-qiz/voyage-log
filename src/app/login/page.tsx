"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    setError(null);
    setIsSigningIn(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      router.push("/");
    } catch {
      setError("サインインに失敗しました。もう一度お試しください。");
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-lg border border-black/[.08] bg-white px-8 py-12 text-center dark:border-white/[.145] dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          作業の航海日誌
        </h1>
        <button
          type="button"
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
        >
          {isSigningIn ? "サインイン中..." : "Googleでサインイン"}
        </button>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </div>
  );
}
