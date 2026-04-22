"use client";

import { DownloadButton } from "@/components/downloader/download-button";
import { ModeSelector } from "@/components/downloader/mode-selector";
import type { DownloadMode } from "@/types/downloader";

type VideoDownloadRowProps = {
  title: string;
  thumbnail: string;
  mode: DownloadMode;
  qualities: {
    video: Array<{ label: string; value: string }>;
    audio: Array<{ label: string; value: string }>;
  };
  loading: boolean;
  onModeChange: (mode: DownloadMode) => void;
  onDownload: () => void;
};

export function VideoDownloadRow({
  title,
  thumbnail,
  mode,
  qualities,
  loading,
  onModeChange,
  onDownload,
}: VideoDownloadRowProps) {
  const currentQualities = mode === "audio" ? qualities.audio : qualities.video;

  return (
    <div className="w-full max-w-6xl rounded-xl border border-white/10 bg-zinc-900/70 p-3">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnail}
          alt={title}
          className="w-50 rounded-lg object-cover"
          loading="lazy"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-center text-xl font-semibold text-white sm:text-2xl">
            {title}
          </p>
        </div>

        <div className="w-full max-w-xs space-y-3 md:ml-auto">
          <ModeSelector value={mode} onChange={onModeChange} />
        </div>
      </div>

      <div className="mt-3">
        <DownloadButton
          loading={loading}
          disabled={loading || currentQualities.length === 0}
          onClick={onDownload}
        />
      </div>
    </div>
  );
}
