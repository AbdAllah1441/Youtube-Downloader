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
    <div className="w-full max-w-6xl rounded-xl border border-white/10 bg-zinc-900/70 p-3">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnail}
          alt={title}
          className="h-20 w-36 rounded-lg object-cover"
          loading="lazy"
        />

        <div className="min-w-0 w-full max-w-xl">
          <p className="truncate text-center text-xl font-semibold text-white sm:text-2xl">
            {title}
          </p>
        </div>

        <div className="w-full max-w-xs space-y-3 ml-auto">
          <ModeSelector value={mode} onChange={onModeChange} />
        </div>
      </div>

      <div className="mt-3">
        <DownloadButton
          loading={loading}
          disabled={loading}
          onClick={onDownload}
        />
      </div>
    </div>
  );
}
