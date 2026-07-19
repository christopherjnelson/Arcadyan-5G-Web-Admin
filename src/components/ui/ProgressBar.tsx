export function ProgressBar({
  percent,
  colorClass,
  label,
}: {
  percent: number;
  colorClass: string;
  label?: string;
}) {
  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      className="relative h-5 w-full overflow-hidden rounded bg-slate-700"
    >
      <div
        className={`h-full transition-all ${colorClass}`}
        style={{ width: `${percent}%` }}
      />
      {label && (
        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
          {label}
        </span>
      )}
    </div>
  );
}
