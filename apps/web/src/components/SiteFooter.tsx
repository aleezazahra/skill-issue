import { Link } from "react-router-dom";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="page-shell flex flex-col gap-8 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm space-y-3">
          <Logo />
          <p className="text-sm leading-relaxed text-muted">
            Evidence-backed issue matching for developers who want a defensible place to start.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-14 gap-y-2 text-sm">
          <Link to="/analyze" className="muted-link">
            Analyze
          </Link>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="muted-link">
            GitHub
          </a>
          <Link to="/#how-it-works" className="muted-link">
            How it works
          </Link>
          <Link to="/#scoring" className="muted-link">
            Scoring
          </Link>
        </div>
      </div>
      <div className="page-shell flex flex-col gap-2 border-t border-line py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          Skills are estimates supported by evidence, not certifications.
        </p>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          Local Gemma · GitHub REST
        </p>
      </div>
    </footer>
  );
}
