"use client";

import { useMemo, useState } from "react";

type QualityOption = {
  label: string;
  value: string;
};

type QualityDropdownProps = {
  options: QualityOption[];
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export function QualityDropdown({
  options,
  value,
  disabled,
  onChange,
}: QualityDropdownProps) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  return (
    <div className="relative w-full">
      <button
        type="button"
        disabled={disabled || options.length === 0}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-100 transition hover:border-red-500/50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="truncate">
          {selected?.label || (options.length ? "Choose quality" : "No quality")}
        </span>
        <span className="text-zinc-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && options.length > 0 ? (
        <div className="absolute z-20 mt-2 max-h-56 w-full overflow-auto rounded-xl border border-white/10 bg-zinc-950 p-1 shadow-xl">
          {options.map((option) => {
            const isActive = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={[
                  "w-full rounded-lg px-3 py-2 text-left text-sm transition",
                  isActive
                    ? "bg-red-600 text-white"
                    : "text-zinc-200 hover:bg-white/5",
                ].join(" ")}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
