"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordInput({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest2 text-bark">{label}</span>
      <span className="relative mt-1 block">
        <input
          {...rest}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          className="w-full border border-line rounded px-3 py-2.5 pr-11 bg-weave focus:border-indigo"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          tabIndex={-1}
          className="absolute right-1 top-1/2 -translate-y-1/2 tap-target w-9 flex items-center justify-center text-bark hover:text-ink"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );
}
