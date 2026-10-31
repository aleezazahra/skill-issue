import { AlertTriangle, Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export function ErrorNotice({
  title = "Something went wrong",
  message,
  action,
  className,
}: {
  title?: string;
  message: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn("surface panel-pad flex items-start gap-3 border-danger/40", className)}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-sm text-secondary">{message}</p>
        {action && <div className="pt-2">{action}</div>}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
  icon,
}: {
  title: string;
  message: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="surface-pad flex flex-col items-center gap-3 rounded-panel border border-line bg-surface px-6 py-14 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-elevated text-muted">
        {icon ?? <Inbox size={19} aria-hidden="true" />}
      </span>
      <h3 className="text-lg">{title}</h3>
      <p className="max-w-md text-sm text-secondary">{message}</p>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
