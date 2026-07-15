"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

const PUBLIC_PATHS = ["/login"];

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
  }, []);

  const normalizedPathname = pathname.replace(/\/+$/, "") || "/";
  const isPublicPath = PUBLIC_PATHS.includes(normalizedPathname);

  useEffect(() => {
    if (!isLoading && !user && !isPublicPath) {
      router.replace("/login");
    }
  }, [isLoading, user, isPublicPath, router]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p style={{ color: "var(--text-dim)" }}>読み込み中...</p>
      </div>
    );
  }

  if (!user && !isPublicPath) {
    return null;
  }

  return <>{children}</>;
}
