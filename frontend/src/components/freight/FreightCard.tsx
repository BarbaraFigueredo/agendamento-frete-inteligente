import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { FreightScheduling } from "../../types/freight";
import StatusBadge from "./StatusBadge";

interface Props {
  freight: FreightScheduling;
  onClick?: () => void;
}

export default function FreightCard({ freight, onClick }: Props) {
  return (
    <div
      className="card p-5 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-gray-900">{freight.requester_name}</p>
          <p className="text-xs text-gray-500 font-mono mt-0.5">{freight.id.slice(0, 8)}…</p>
        </div>
        <StatusBadge status={freight.status} />
      </div>

      <div className="space-y-1.5 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          <span className="truncate">
            {freight.pickup_city}, {freight.pickup_state}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
          <span className="truncate">
            {freight.delivery_city}, {freight.delivery_state}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span className="font-medium">{freight.modality}</span>
        <span>{format(new Date(freight.scheduled_date + "T12:00:00"), "dd MMM yyyy", { locale: ptBR })}</span>
      </div>
    </div>
  );
}
