import type { ReactNode } from "react";
import { X } from "lucide-react";

export function Alert({
  title,
  children,
  onDismiss,
}: {
  title: string;
  children: ReactNode;
  onDismiss?: () => void;
}) {
  return (
    <div
      role="alert"
      className="relative rounded-md border border-rose-500/50 bg-rose-950/60 p-4 text-rose-100"
    >
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="absolute right-2 top-2 rounded p-1 hover:bg-rose-900"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <h3 className="mb-1 font-semibold">{title}</h3>
      <div className="text-sm">{children}</div>
    </div>
  );
}
