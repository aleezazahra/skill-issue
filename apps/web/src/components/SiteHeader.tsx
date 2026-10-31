import { Github } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "./Button";
import { Logo } from "./Logo";

const navItems = [
  { label: "How it works", to: "/#how-it-works" },
  { label: "Scoring", to: "/#scoring" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-canvas">
      <div className="page-shell flex h-[72px] items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {navItems.map((item) =>
            item.to.includes("#") ? (
              <Link key={item.label} to={item.to} className="nav-link">
                {item.label}
              </Link>
            ) : (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  isActive ? "nav-link nav-link-active" : "nav-link"
                }
              >
                {item.label}
              </NavLink>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="icon-btn icon-btn-sm sm:h-10 sm:w-10"
            aria-label="Open GitHub"
          >
            <Github size={17} aria-hidden="true" />
          </a>
          <Button to="/analyze" size="sm" className="hidden sm:inline-flex">
            Analyze profile
          </Button>
        </div>
      </div>
    </header>
  );
}
