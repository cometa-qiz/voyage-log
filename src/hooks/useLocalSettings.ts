import { useEffect, useState } from "react";

function readStoredValue<T>(key: string, initialValue: T): T {
  // output:'export'のビルド/プリレンダー時はwindowが存在しないため初期値を返す
  if (typeof window === "undefined") return initialValue;
  try {
    const raw = window.localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : initialValue;
  } catch {
    return initialValue;
  }
}

function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() =>
    readStoredValue(key, initialValue),
  );

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

export function useActiveId() {
  return useLocalStorageState<string | null>("voyage-log-activeId", null);
}

export function useView() {
  return useLocalStorageState<"chart" | "collection">(
    "voyage-log-view",
    "chart",
  );
}

export function useMuted() {
  return useLocalStorageState<boolean>("voyage-log-muted", false);
}

export function useDockOpen() {
  return useLocalStorageState<boolean>("voyage-log-dockOpen", true);
}
