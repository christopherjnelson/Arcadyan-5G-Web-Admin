import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  invalid?: boolean;
  /** Optional trailing adornment, e.g. a show/hide password toggle. */
  trailing?: ReactNode;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput({ label, invalid = false, trailing, id, ...rest }, ref) {
    return (
      <div>
        <label
          htmlFor={id}
          className="mb-1 block text-sm font-medium text-slate-300"
        >
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={id}
            aria-invalid={invalid || undefined}
            className={`block w-full rounded-md border bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 ${
              invalid
                ? "border-rose-500 focus:ring-rose-500"
                : "border-slate-600 focus:border-amber-400 focus:ring-amber-400"
            } ${trailing ? "pr-10" : ""}`}
            {...rest}
          />
          {trailing && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
              {trailing}
            </div>
          )}
        </div>
      </div>
    );
  },
);
