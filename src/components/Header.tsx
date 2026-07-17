"use client";

import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useSoundContext } from "@/components/SoundProvider";
import { useToastContext } from "@/components/ToastProvider";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  exportVoyageLog,
  importVoyageLog,
  validateImportPayload,
} from "@/lib/importExport";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const { muted, toggleMute, volume, setVolume } = useSoundContext();
  const { showToast } = useToastContext();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [pendingImportText, setPendingImportText] = useState<string | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  if (!user) {
    return null;
  }

  const handleSignOut = () => {
    signOut(auth);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportVoyageLog(user.uid);
    } catch {
      showToast("書き出しに失敗しました。", "error");
    } finally {
      setIsExporting(false);
    }
  };

  // importData()（docs/voyage-log.html 1722〜1739行目）の
  // 「パース→バリデーション→confirm()→反映」の順序を踏襲。
  // confirm()の代わりにConfirmDialogを使うため、ここでは事前検証のみ行い、
  // 実際の書き込み（importVoyageLog）は確認後に行う。
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result);
      try {
        validateImportPayload(text);
        setPendingImportText(text);
      } catch {
        showToast("読み込めませんでした。ファイル形式を確認してください。", "error");
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!pendingImportText) return;
    setIsImporting(true);
    try {
      const result = await importVoyageLog(user.uid, pendingImportText);
      showToast(
        `インポートが完了しました（航路${result.voyageCount}件・宝${result.treasureCount}件）`,
        "success",
      );
    } catch {
      showToast("読み込めませんでした。ファイル形式を確認してください。", "error");
    } finally {
      setIsImporting(false);
      setPendingImportText(null);
    }
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
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          disabled={muted}
          style={{ width: "70px", verticalAlign: "middle" }}
          title="音量"
        />
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="btn-ghost"
        >
          {isExporting ? "書き出し中..." : "書き出し"}
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="btn-ghost"
        >
          {isImporting ? "読み込み中..." : "読み込み"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <button type="button" onClick={handleSignOut} className="btn-ghost">
          サインアウト
        </button>
      </div>
      {pendingImportText && (
        <ConfirmDialog
          message="現在のデータを読み込んだ内容で置き換えます。よろしいですか？"
          confirmLabel="読み込む"
          onConfirm={handleConfirmImport}
          onCancel={() => setPendingImportText(null)}
        />
      )}
    </header>
  );
}
