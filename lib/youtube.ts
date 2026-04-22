import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Readable } from "node:stream";

import type { DownloadMode } from "@/types/downloader";

function resolveYtDlpBinary(): string {
  if (process.env.YT_DLP_PATH) {
    return process.env.YT_DLP_PATH;
  }

  const candidates = [
    join(homedir(), ".local", "bin", "yt-dlp"),
    "/usr/local/bin/yt-dlp",
    "/usr/bin/yt-dlp",
    "/opt/homebrew/bin/yt-dlp",
  ];

  for (const candidate of candidates) {
    try {
      if (existsSync(candidate)) {
        return candidate;
      }
    } catch {
      // ignore and keep looking
    }
  }

  return "yt-dlp";
}

const YT_DLP_BINARY = resolveYtDlpBinary();

const YOUTUBE_URL_REGEX =
  /^(https?:\/\/)?(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\/.+/i;

export function validateYouTubeUrl(url: string): boolean {
  return YOUTUBE_URL_REGEX.test(url);
}

function runYtDlp(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(YT_DLP_BINARY, args);
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(stderr.trim() || `yt-dlp exited with code ${code}`));
      }
    });
  });
}

export async function getVideoTitle(url: string): Promise<string> {
  return runYtDlp([
    "--no-warnings",
    "--skip-download",
    "--print",
    "title",
    url,
  ]);
}

export type VideoInfo = {
  title: string;
  thumbnail: string;
  webpageUrl: string;
  qualities: {
    video: Array<{ label: string; value: string }>;
    audio: Array<{ label: string; value: string }>;
  };
};

export type BasicVideoInfo = {
  title: string;
  thumbnail: string;
  webpageUrl: string;
};

export type VideoCollectionInfo = {
  items: BasicVideoInfo[];
  isPlaylist: boolean;
  playlistTitle?: string;
};

export async function getVideoInfo(url: string): Promise<VideoInfo> {
  const output = await runYtDlp([
    "--no-warnings",
    "--no-playlist",
    "--dump-single-json",
    url,
  ]);

  const parsed = JSON.parse(output) as {
    title?: string;
    thumbnail?: string;
    webpage_url?: string;
    formats?: Array<{
      format_id?: string;
      format_note?: string;
      height?: number;
      ext?: string;
      vcodec?: string;
      acodec?: string;
      abr?: number;
      asr?: number;
    }>;
  };

  const formats = parsed.formats ?? [];

  const videoSeen = new Set<string>();
  const videoQualities = formats
    .filter(
      (format) =>
        format.format_id &&
        format.vcodec &&
        format.vcodec !== "none" &&
        format.acodec &&
        format.acodec !== "none",
    )
    .map((format) => {
      const quality = format.height
        ? `${format.height}p`
        : format.format_note || "Video";
      const label = `${quality}${format.ext ? ` (${format.ext.toUpperCase()})` : ""}`;
      return { label, value: format.format_id as string };
    })
    .filter((item) => {
      if (videoSeen.has(item.label)) {
        return false;
      }
      videoSeen.add(item.label);
      return true;
    });

  const audioSeen = new Set<string>();
  const audioQualities = formats
    .filter(
      (format) =>
        format.format_id &&
        format.acodec &&
        format.acodec !== "none" &&
        (!format.vcodec || format.vcodec === "none"),
    )
    .map((format) => {
      const quality = format.abr
        ? `${Math.round(format.abr)}kbps`
        : format.asr
          ? `${Math.round(format.asr / 1000)}kHz`
          : "Audio";
      const label = `${quality}${format.ext ? ` (${format.ext.toUpperCase()})` : ""}`;
      return { label, value: format.format_id as string };
    })
    .filter((item) => {
      if (audioSeen.has(item.label)) {
        return false;
      }
      audioSeen.add(item.label);
      return true;
    });

  return {
    title: parsed.title || "YouTube video",
    thumbnail: parsed.thumbnail || "",
    webpageUrl: parsed.webpage_url || url,
    qualities: {
      video: videoQualities,
      audio: audioQualities,
    },
  };
}

export async function getVideoCollectionInfo(
  url: string,
): Promise<VideoCollectionInfo> {
  const output = await runYtDlp([
    "--no-warnings",
    "--flat-playlist",
    "--dump-single-json",
    url,
  ]);

  const parsed = JSON.parse(output) as {
    title?: string;
    thumbnail?: string;
    webpage_url?: string;
    entries?: Array<{
      title?: string;
      thumbnail?: string;
      url?: string;
      id?: string;
      webpage_url?: string;
    }>;
  };

  const entries = parsed.entries ?? [];
  const isPlaylist = entries.length > 0;

  if (isPlaylist) {
    const items = entries
      .map((entry): BasicVideoInfo | null => {
        const videoId =
          entry.id ||
          (!entry.url?.startsWith("http") ? entry.url : undefined) ||
          undefined;
        const entryUrl =
          entry.webpage_url ||
          (entry.url?.startsWith("http")
            ? entry.url
            : entry.id
              ? `https://www.youtube.com/watch?v=${entry.id}`
              : "");
        if (!entryUrl) {
          return null;
        }
        const thumbnail =
          entry.thumbnail ||
          (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "");

        return {
          title: entry.title || "YouTube video",
          thumbnail,
          webpageUrl: entryUrl,
        };
      })
      .filter((item): item is BasicVideoInfo => Boolean(item));

    return {
      items,
      isPlaylist: true,
      playlistTitle: parsed.title || "YouTube Playlist",
    };
  }

  return {
    items: [
      {
        title: parsed.title || "YouTube video",
        thumbnail: parsed.thumbnail || "",
        webpageUrl: parsed.webpage_url || url,
      },
    ],
    isPlaylist: false,
  };
}

function sanitizeFilenamePart(value: string): string {
  return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").trim();
}

function buildYtDlpArgs(
  mode: DownloadMode,
  url: string,
  quality?: string,
): string[] {
  const commonArgs = ["--no-warnings", "--no-playlist", "-o", "-"];

  if (mode === "audio") {
    return [
      ...commonArgs,
      "-x",
      "--audio-format",
      "mp3",
      "--audio-quality",
      "0",
      "-f",
      quality || "bestaudio/best",
      url,
    ];
  }

  return [...commonArgs, "-f", quality || "best[ext=mp4]/best", url];
}

export type DownloadConfig = {
  filename: string;
  contentType: string;
  stream: Readable;
  onError: (handler: (error: Error) => void) => void;
};

export async function buildDownloadConfig(
  url: string,
  mode: DownloadMode,
  quality?: string,
): Promise<DownloadConfig> {
  const title = await getVideoTitle(url).catch(() => "youtube-download");
  const cleanTitle = sanitizeFilenamePart(title) || "youtube-download";

  const extension = mode === "audio" ? "mp3" : "mp4";
  const contentType = mode === "audio" ? "audio/mpeg" : "video/mp4";
  const filename = `${cleanTitle}.${extension}`;

  const child = spawn(YT_DLP_BINARY, buildYtDlpArgs(mode, url, quality));

  let stderrBuffer = "";
  child.stderr.on("data", (chunk) => {
    stderrBuffer += chunk.toString();
  });

  return {
    filename,
    contentType,
    stream: child.stdout,
    onError: (handler) => {
      child.on("error", handler);
      child.on("close", (code) => {
        if (code !== 0) {
          handler(
            new Error(stderrBuffer.trim() || `yt-dlp exited with code ${code}`),
          );
        }
      });
    },
  };
}
