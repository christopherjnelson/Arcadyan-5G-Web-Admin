import type { ReactNode } from "react";

export function Card({
  title,
  children,
  className = "",
}: {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg bg-slate-800 text-slate-100 shadow-lg ${className}`}
    >
      <div className="p-4 sm:p-6">
        {title && (
          <h2 className="mb-4 text-lg font-semibold tracking-wide">{title}</h2>
        )}
        {children}
      </div>
    </section>
  );
}
