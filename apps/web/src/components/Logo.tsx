import { Link } from "react-router-dom";
import { cn } from "../lib/cn";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link
      to="/"
      className={cn("inline-flex items-center gap-2.5 text-ink", className)}
      aria-label="skillissue home"
    >
      <span
        aria-hidden="true"
        className="relative flex h-8 w-8 items-center justify-center rounded-full border border-green/60"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-green" />
        <span className="absolute right-[7px] top-[6px] h-1.5 w-1.5 rounded-full bg-green/50" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[1.15rem] font-medium lowercase tracking-[0.02em]">skillissue</span>
          <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.24em] text-muted">OpenSource Matchmaker</span>
        </span>
      )}
    </Link>
  );
}
