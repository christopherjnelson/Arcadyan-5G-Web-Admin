import type { ReactNode } from "react";

export function Badge({
  color,
  children,
}: {
  color: "green" | "red";
  children: ReactNode;
}) {
  const classes =
    color === "green"
      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
      : "bg-rose-500/15 text-rose-300 ring-rose-400/30";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${classes}`}
    >
      {children}
    </span>
  );
}
