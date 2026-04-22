"use client";

type UrlInputProps = {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
};

export function UrlInput({ value, onChange, disabled }: UrlInputProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm text-zinc-300">YouTube URL</span>
      <input
        type="url"
        inputMode="url"
        required
        placeholder="https://www.youtube.com/watch?v=..."
        className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 disabled:opacity-70"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
    </label>
  );
}
