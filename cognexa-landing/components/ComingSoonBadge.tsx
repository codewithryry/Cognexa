export default function ComingSoonBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Coming Soon
    </span>
  );
}
