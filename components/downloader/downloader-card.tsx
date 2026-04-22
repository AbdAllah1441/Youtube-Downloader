"use client";

import type { FormEvent } from "react";

import { DownloadButton } from "@/components/downloader/download-button";
import { ModeSelector } from "@/components/downloader/mode-selector";
import { UrlInput } from "@/components/downloader/url-input";
import type { DownloadMode } from "@/types/downloader";

type DownloaderCardProps = {
  url: string;
  mode: DownloadMode;
  loading: boolean;
  statusMessage: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUrlChange: (url: string) => void;
  onModeChange: (mode: DownloadMode) => void;
};

export function DownloaderCard({
  url,
  mode,
  loading,
  statusMessage,
  onSubmit,
  onUrlChange,
  onModeChange,
}: DownloaderCardProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-xl rounded-2xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur"
    >
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-semibold text-white">YouTube Downloader</h1>
        <p className="text-sm text-zinc-400">
          Paste your video link, pick a format, and download directly.
        </p>
      </div>

      <div className="space-y-4">
        <ModeSelector value={mode} onChange={onModeChange} />
        <UrlInput value={url} onChange={onUrlChange} disabled={loading} />
        <DownloadButton loading={loading} disabled={loading || !url.trim()} />
      </div>

      <p className="mt-4 min-h-5 text-sm text-zinc-300">{statusMessage}</p>
    </form>
  );
}
