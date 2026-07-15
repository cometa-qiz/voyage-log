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
    <div className="flex flex-1 items-center justify-center">
      <div className="modal flex flex-col items-center gap-6 text-center">
        <div>
          <h1 className="login-title">作業の航海日誌</h1>
          <p className="subtitle">船員手帳の提示</p>
        </div>
        <button
          type="button"
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="btn-ok w-full"
        >
          {isSigningIn ? "サインイン中..." : "Googleでサインイン"}
        </button>
        {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
      </div>
    </div>
  );
}
