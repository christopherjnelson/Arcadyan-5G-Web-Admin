import type { ReactNode } from "react";

/** Label/value row used across the detail cards. */
export function DetailRow({
  label,
  trailing,
  children,
}: {
  label: string;
  /** Optional third-column content, e.g. an info popover or toggle. */
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-1 text-sm">
      <dt className="font-semibold text-slate-300">{label}</dt>
      <dd className="break-all text-slate-100">{children}</dd>
      {trailing ? <dd>{trailing}</dd> : null}
    </div>
  );
}
