import { spawn } from "node:child_process";
import type { Readable } from "node:stream";

import type { DownloadMode } from "@/types/downloader";

const YT_DLP_BINARY = process.env.YT_DLP_PATH || "yt-dlp";

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
  return runYtDlp(["--no-warnings", "--skip-download", "--print", "title", url]);
}

export type VideoInfo = {
  title: string;
  thumbnail: string;
  webpageUrl: string;
  qualities: {
    video: string[];
    audio: string[];
  };
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

  const videoQualities = Array.from(
    new Set(
      formats
        .filter(
          (format) =>
            format.vcodec &&
            format.vcodec !== "none" &&
            (format.height || format.format_note),
        )
        .map((format) => {
          if (format.height) {
            return `${format.height}p`;
          }
          if (format.format_note) {
            return format.format_note;
          }
          return "Unknown";
        }),
    ),
  );

  const audioQualities = Array.from(
    new Set(
      formats
        .filter((format) => format.acodec && format.acodec !== "none")
        .map((format) => {
          if (format.abr) {
            return `${Math.round(format.abr)}kbps`;
          }
          if (format.asr) {
            return `${Math.round(format.asr / 1000)}kHz`;
          }
          return format.ext?.toUpperCase() || "Audio";
        }),
    ),
  );

  return {
    title: parsed.title || "YouTube video",
    thumbnail: parsed.thumbnail || "",
    webpageUrl: parsed.webpage_url || url,
    qualities: {
      video: videoQualities.length ? videoQualities : ["Auto"],
      audio: audioQualities.length ? audioQualities : ["Auto"],
    },
  };
}

function sanitizeFilenamePart(value: string): string {
  return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").trim();
}

function buildYtDlpArgs(mode: DownloadMode, url: string): string[] {
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
      "bestaudio/best",
      url,
    ];
  }

  return [
    ...commonArgs,
    "-f",
    "best[ext=mp4]/best",
    url,
  ];
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
): Promise<DownloadConfig> {
  const title = await getVideoTitle(url).catch(() => "youtube-download");
  const cleanTitle = sanitizeFilenamePart(title) || "youtube-download";

  const extension = mode === "audio" ? "mp3" : "mp4";
  const contentType = mode === "audio" ? "audio/mpeg" : "video/mp4";
  const filename = `${cleanTitle}.${extension}`;

  const child = spawn(YT_DLP_BINARY, buildYtDlpArgs(mode, url));

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
