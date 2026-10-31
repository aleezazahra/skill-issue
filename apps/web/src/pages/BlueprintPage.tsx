import { useQuery } from "@tanstack/react-query";
import type { BlueprintRecord } from "@osm/shared";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { EmptyState, ErrorNotice } from "../components/Feedback";
import { BlueprintView } from "../features/blueprints/BlueprintView";
import { ApiError, api } from "../lib/api";

export function BlueprintPage() {
  const { id = "" } = useParams();

  const blueprintQuery = useQuery<BlueprintRecord>({
    queryKey: ["blueprint", id],
    queryFn: () => api.getBlueprint(id),
    enabled: Boolean(id),
    retry: 0,
  });

  if (!id) {
    return (
      <div className="page-shell py-20">
        <EmptyState
          title="No blueprint selected"
          message="Choose an issue from an analysis to generate a contribution blueprint."
          action={<Button to="/analyze">Start an analysis</Button>}
        />
      </div>
    );
  }

  if (blueprintQuery.isPending) {
    return (
      <div className="page-shell py-12">
        <div className="skeleton h-4 w-32" />
        <div className="mt-6 skeleton h-44 rounded-panel" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="skeleton h-40 rounded-panel" />
            <div className="skeleton h-64 rounded-panel" />
            <div className="skeleton h-52 rounded-panel" />
          </div>
          <div className="space-y-6">
            <div className="skeleton h-44 rounded-panel" />
            <div className="skeleton h-44 rounded-panel" />
          </div>
        </div>
      </div>
    );
  }

  if (blueprintQuery.isError || !blueprintQuery.data) {
    const error = blueprintQuery.error;
    return (
      <div className="page-shell py-16">
        <ErrorNotice
          title="Blueprint unavailable"
          message={
            error instanceof ApiError
              ? error.message
              : "This blueprint may have expired when the API restarted."
          }
          action={
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => blueprintQuery.refetch()}>
                <RefreshCw size={13} aria-hidden="true" />
                Retry
              </Button>
              <Button size="sm" to="/analyze">
                Start a new analysis
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  const blueprint = blueprintQuery.data;

  return (
    <div className="page-shell py-8 sm:py-10">
      <Link
        to={`/analysis/${blueprint.analysisId}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Back to analysis
      </Link>

      <div className="mt-6">
        <BlueprintView blueprint={blueprint} />
      </div>
    </div>
  );
}
