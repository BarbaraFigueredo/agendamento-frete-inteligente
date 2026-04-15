import clsx from "clsx";
import type { FreightStatus } from "../../types/freight";

const STATUS_CONFIG: Record<FreightStatus, { label: string; className: string }> = {
  DRAFT:      { label: "Rascunho",    className: "bg-gray-100 text-gray-700" },
  CONFIRMED:  { label: "Confirmado",  className: "bg-blue-100 text-blue-700" },
  ASSIGNED:   { label: "Designado",   className: "bg-purple-100 text-purple-700" },
  IN_TRANSIT: { label: "Em Trânsito", className: "bg-yellow-100 text-yellow-700" },
  DELIVERED:  { label: "Entregue",    className: "bg-green-100 text-green-700" },
  CANCELLED:  { label: "Cancelado",   className: "bg-red-100 text-red-700" },
};

export default function StatusBadge({ status }: { status: FreightStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["DRAFT"];
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        cfg.className
      )}
    >
      {cfg.label}
    </span>
  );
}
