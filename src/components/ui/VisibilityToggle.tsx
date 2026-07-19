import { Eye, EyeOff } from "lucide-react";

/** Eye/eye-off button that toggles visibility of a sensitive value. */
export function VisibilityToggle({
  visible,
  onToggle,
  subject,
}: {
  visible: boolean;
  onToggle: () => void;
  /** Noun used in the aria-label, e.g. "password" or "key". */
  subject: string;
}) {
  return (
    <button
      type="button"
      aria-label={visible ? `Hide ${subject}` : `Show ${subject}`}
      onClick={onToggle}
      className="text-slate-400 transition-colors hover:text-amber-400"
    >
      {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
    </button>
  );
}
