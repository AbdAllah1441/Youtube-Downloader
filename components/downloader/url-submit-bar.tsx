"use client";

import type { FormEvent } from "react";

type UrlSubmitBarProps = {
  url: string;
  loading: boolean;
  onUrlChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function UrlSubmitBar({
  url,
  loading,
  onUrlChange,
  onSubmit,
}: UrlSubmitBarProps) {
  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-4xl gap-3">
      <input
        type="url"
        inputMode="url"
        required
        placeholder="Paste YouTube URL..."
        value={url}
        onChange={(event) => onUrlChange(event.target.value)}
        disabled={loading}
        className="h-12 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 disabled:opacity-70"
      />
      <button
        type="submit"
        disabled={loading || !url.trim()}
        className="h-12 shrink-0 rounded-xl bg-red-600 px-6 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Loading..." : "Fetch"}
      </button>
    </form>
  );
}
