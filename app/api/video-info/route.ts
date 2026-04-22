import { type NextRequest, NextResponse } from "next/server";

import { getVideoCollectionInfo, validateYouTubeUrl } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")?.trim();

  if (!url) {
    return NextResponse.json(
      { error: "Missing YouTube URL." },
      { status: 400 },
    );
  }

  if (!validateYouTubeUrl(url)) {
    return NextResponse.json(
      { error: "Invalid YouTube URL. Please check and try again." },
      { status: 400 },
    );
  }

  try {
    const info = await getVideoCollectionInfo(url);
    return NextResponse.json(info);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message.split("\n")[0]
        : "Failed to load video.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
