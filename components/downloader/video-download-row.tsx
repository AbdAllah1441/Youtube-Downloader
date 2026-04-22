"use client";

import { DownloadButton } from "@/components/downloader/download-button";
import { ModeSelector } from "@/components/downloader/mode-selector";
import type { DownloadMode } from "@/types/downloader";

type VideoDownloadRowProps = {
  title: string;
  thumbnail: string;
  mode: DownloadMode;
  loading: boolean;
  onModeChange: (mode: DownloadMode) => void;
  onDownload: () => void;
};

export function VideoDownloadRow({
  title,
  thumbnail,
  mode,
  loading,
  onModeChange,
  onDownload,
}: VideoDownloadRowProps) {
  return (
    <div className="flex w-full max-w-4xl items-center gap-4 rounded-xl border border-white/10 bg-zinc-900/70 p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbnail}
        alt={title}
        className="h-20 w-36 rounded-lg object-cover"
        loading="lazy"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{title}</p>
      </div>

      <div className="w-44 shrink-0">
        <ModeSelector value={mode} onChange={onModeChange} />
      </div>

      <DownloadButton loading={loading} disabled={loading} onClick={onDownload} />
    </div>
  );
}
