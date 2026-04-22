import { Readable } from "node:stream";

import { type NextRequest, NextResponse } from "next/server";

import { buildDownloadConfig, validateYouTubeUrl } from "@/lib/youtube";
import type { DownloadMode } from "@/types/downloader";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_MODES: DownloadMode[] = ["video", "audio"];

function isDownloadMode(value: string): value is DownloadMode {
  return ALLOWED_MODES.includes(value as DownloadMode);
}

function toUserErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Could not fetch this video stream right now.";
  }

  const message = error.message || "";
  if (message.includes("EAI_AGAIN") || message.includes("ENOTFOUND")) {
    return "Network/DNS issue while contacting YouTube. Check server internet and try again.";
  }
  if (message.includes("ENOENT")) {
    return "yt-dlp binary not found on server. Install yt-dlp or set YT_DLP_PATH.";
  }
  if (message.includes("Video unavailable")) {
    return "This video is unavailable.";
  }
  if (message.includes("Private video")) {
    return "This video is private.";
  }

  return message.split("\n")[0] || "Could not fetch this video stream right now.";
}

function toAsciiFilename(value: string): string {
  // Header values in Node/Fetch must be ByteString-compatible.
  const ascii = value.replace(/[^\x20-\x7E]/g, "_");
  return ascii.replace(/["\\]/g, "_");
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")?.trim();
  const modeParam = request.nextUrl.searchParams.get("mode") ?? "video";
  const qualityParam = request.nextUrl.searchParams.get("quality")?.trim();

  if (!url) {
    return NextResponse.json({ error: "Missing YouTube URL." }, { status: 400 });
  }

  if (!isDownloadMode(modeParam)) {
    return NextResponse.json(
      { error: "Invalid mode. Use video or audio." },
      { status: 400 },
    );
  }

  if (!validateYouTubeUrl(url)) {
    return NextResponse.json(
      { error: "Invalid YouTube URL. Please check and try again." },
      { status: 400 },
    );
  }

  if (qualityParam && !/^[a-zA-Z0-9+_.-]+$/.test(qualityParam)) {
    return NextResponse.json({ error: "Invalid quality format." }, { status: 400 });
  }

  try {
    const { stream, filename, contentType, onError } = await buildDownloadConfig(
      url,
      modeParam,
      qualityParam,
    );
    const asciiFilename = toAsciiFilename(filename);

    onError((error) => {
      console.error("yt-dlp process error:", error.message);
    });

    const webStream = Readable.toWeb(stream) as ReadableStream<Uint8Array>;

    return new NextResponse(webStream, {
      headers: {
        "content-type": contentType,
        "content-disposition": `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error("Download API error:", error);

    return NextResponse.json(
      { error: toUserErrorMessage(error) },
      { status: 500 },
    );
  }
}
