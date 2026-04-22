"use client";

import { type FormEvent, useMemo, useState } from "react";

import { UrlSubmitBar } from "@/components/downloader/url-submit-bar";
import { VideoDownloadRow } from "@/components/downloader/video-download-row";
import type { DownloadMode } from "@/types/downloader";

const DEFAULT_ERROR = "Unable to download this video right now.";

type VideoInfoResponse = {
  title: string;
  thumbnail: string;
  webpageUrl: string;
  qualities: {
    video: string[];
    audio: string[];
  };
};

type StatusKind = "info" | "success" | "error";

function filenameFromDisposition(value: string | null) {
  if (!value) {
    return null;
  }

  const utf8Match = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const plainMatch = value.match(/filename="?([^"]+)"?/i);
  return plainMatch?.[1] ?? null;
}

export function DownloaderScreen() {
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<DownloadMode>("video");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfoResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    "Ready when you are. Paste a YouTube URL.",
  );
  const [statusKind, setStatusKind] = useState<StatusKind>("info");

  const trimmedUrl = useMemo(() => url.trim(), [url]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!trimmedUrl) {
      setStatusKind("error");
      setStatusMessage("Please add a YouTube URL first.");
      return;
    }

    setSubmitLoading(true);
    setStatusKind("info");
    setStatusMessage("Loading video info...");

    try {
      const query = new URLSearchParams({ url: trimmedUrl });
      const response = await fetch(`/api/video-info?${query.toString()}`);
      if (!response.ok) {
        let errorMessage = DEFAULT_ERROR;
        try {
          const body = (await response.json()) as { error?: string };
          errorMessage = body.error || DEFAULT_ERROR;
        } catch {
          // Keep fallback message if JSON parsing fails.
        }
        throw new Error(errorMessage);
      }

      const info = (await response.json()) as VideoInfoResponse;
      setVideoInfo(info);
      setStatusKind("success");
      setStatusMessage("Select audio/video and click download.");
    } catch (error) {
      const message = error instanceof Error ? error.message : DEFAULT_ERROR;
      setStatusKind("error");
      setStatusMessage(message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!videoInfo?.webpageUrl) {
      return;
    }

    setDownloadLoading(true);
    setStatusKind("info");
    setStatusMessage("Preparing download...");

    try {
      const query = new URLSearchParams({ url: videoInfo.webpageUrl, mode });
      const response = await fetch(`/api/download?${query.toString()}`);
      if (!response.ok) {
        let errorMessage = DEFAULT_ERROR;
        try {
          const body = (await response.json()) as { error?: string };
          errorMessage = body.error || DEFAULT_ERROR;
        } catch {
          // Keep fallback message if JSON parsing fails.
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition");
      const filename =
        filenameFromDisposition(disposition) ||
        `youtube-${mode}.${mode === "audio" ? "mp3" : "mp4"}`;

      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);

      setStatusKind("success");
      setStatusMessage("Download started.");
    } catch (error) {
      const message = error instanceof Error ? error.message : DEFAULT_ERROR;
      setStatusKind("error");
      setStatusMessage(message);
    } finally {
      setDownloadLoading(false);
    }
  };

  const statusClassName =
    statusKind === "error"
      ? "border-red-500/30 bg-red-500/10 text-red-200"
      : statusKind === "success"
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
        : "border-white/10 bg-zinc-900/60 text-zinc-300";

  return (
    <main className="min-h-screen bg-[#0b0b0d] px-4 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
        <header className="space-y-6">
          <h1 className="text-4xl text-center font-bold tracking-tight text-white sm:text-5xl">
            YouTube Downloader
          </h1>
          <p className="text-center text-sm text-zinc-400 sm:text-base">
            Paste a YouTube link, choose audio or video, and download it
            directly to your device.
          </p>
        </header>

        <UrlSubmitBar
          url={url}
          loading={submitLoading}
          onSubmit={handleSubmit}
          onUrlChange={setUrl}
        />

        {videoInfo ? (
          <VideoDownloadRow
            title={videoInfo.title}
            thumbnail={videoInfo.thumbnail}
            mode={mode}
            qualities={videoInfo.qualities}
            loading={downloadLoading}
            onModeChange={setMode}
            onDownload={handleDownload}
          />
        ) : null}

        <div
          className={`rounded-lg border px-3 py-2 text-sm ${statusClassName}`}
        >
          {statusMessage}
        </div>
      </div>
    </main>
  );
}
