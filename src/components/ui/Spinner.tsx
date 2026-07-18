export function Spinner({ size = "md" }: { size?: "sm" | "md" }) {
  const classes = size === "sm" ? "h-4 w-4 border-2" : "h-6 w-6 border-2";
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-current border-t-transparent ${classes}`}
    />
  );
}
