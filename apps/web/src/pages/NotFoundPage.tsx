import { Button } from "../components/Button";

export function NotFoundPage() {
  return (
    <div className="page-shell flex min-h-[60vh] flex-col items-start justify-center py-16">
      <p className="eyebrow mb-4">404</p>
      <h1 className="max-w-[16ch] text-[clamp(2.4rem,5vw,4rem)]">That page is not here.</h1>
      <p className="mt-4 max-w-md text-sm text-secondary">
        The analysis may have expired, or the link may be incorrect. Start from a GitHub profile to
        create a fresh result.
      </p>
      <Button to="/analyze" className="mt-7">
        Start an analysis
      </Button>
    </div>
  );
}
