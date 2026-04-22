"use client";

type DownloadButtonProps = {
  loading: boolean;
  disabled: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
};

export function DownloadButton({
  loading,
  disabled,
  onClick,
  type = "button",
}: DownloadButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Preparing download..." : "Download"}
    </button>
  );
}
