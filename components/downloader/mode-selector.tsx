"use client";

import type { DownloadMode } from "@/types/downloader";

type ModeSelectorProps = {
  value: DownloadMode;
  onChange: (mode: DownloadMode) => void;
};

const OPTIONS: DownloadMode[] = ["video", "audio"];

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/30 p-1">
      {OPTIONS.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={[
              "rounded-lg px-4 py-2 text-sm font-semibold capitalize transition",
              active
                ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                : "text-zinc-300 hover:bg-white/5",
            ].join(" ")}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
