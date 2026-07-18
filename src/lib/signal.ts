/** Signal-strength presentation helpers shared by the signal page. */

export function signalLabel(bars: number | undefined): string {
  switch (bars) {
    case 1:
      return "Poor";
    case 2:
      return "Fair";
    case 3:
      return "Good";
    case 4:
      return "Very Good";
    case 5:
      return "Excellent";
    default:
      return "Offline";
  }
}

/** Tailwind classes for the progress bar fill at each rating. */
export function signalColor(bars: number | undefined): string {
  switch (bars) {
    case 3:
    case 4:
      return "bg-emerald-500";
    case 5:
      return "bg-sky-500";
    case 2:
      return "bg-amber-500";
    default:
      return "bg-rose-600";
  }
}

/** A 0-100 percentage for a 0-5 bar rating. */
export function signalPercent(bars: number | undefined): number {
  return (bars ?? 0) * 20;
}

export function formatBands(bands: string | string[] | undefined): string {
  if (bands === undefined) return "N/A";
  return Array.isArray(bands) ? bands.join(", ") : bands;
}
