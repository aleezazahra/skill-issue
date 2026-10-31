import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { ApiError, api } from "../../lib/api";
import { cn } from "../../lib/cn";

export function BlueprintLauncher({
  analysisId,
  issueId,
  className,
}: {
  analysisId: string;
  issueId: string;
  className?: string;
}) {
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: () => api.createBlueprint(analysisId, issueId),
    onSuccess: (blueprint) => {
      navigate(`/blueprints/${blueprint.id}`);
    },
  });

  const error = mutation.error;
  const message = error instanceof ApiError ? error.message : "The blueprint could not be generated.";

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        className="w-full"
        size="sm"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Drafting blueprint
          </>
        ) : (
          <>
            Generate blueprint
            <ArrowRight size={14} aria-hidden="true" />
          </>
        )}
      </Button>
      {mutation.isError && (
        <p role="alert" className="text-[11px] leading-relaxed text-danger">
          {message}
        </p>
      )}
    </div>
  );
}
