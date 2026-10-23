import { statusLabels } from "@/lib/strings";
import type { DataStatus } from "@/lib/types";

export function DataStatusBadge({ status }: { status: DataStatus }) {
  const className =
    status === "fixture"
      ? "badge badge-danger"
      : status === "disputado"
        ? "badge badge-danger"
        : status === "revisado"
          ? "badge badge-ink"
          : "badge";

  return <span className={className}>{statusLabels[status]}</span>;
}
