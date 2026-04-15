import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { freightApi } from "../api/freight";
import StatusBadge from "../components/freight/StatusBadge";

export default function Tracking() {
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tracking", submitted],
    queryFn: () => freightApi.get(submitted),
    enabled: !!submitted,
    retry: false,
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rastreamento</h1>
        <p className="text-gray-500 text-sm mt-1">Pesquise pelo ID do agendamento</p>
      </div>

      <div className="card p-6">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && input.trim() && setSubmitted(input.trim())}
            className="input flex-1"
            placeholder="Cole o ID do frete (UUID)"
          />
          <button
            onClick={() => input.trim() && setSubmitted(input.trim())}
            disabled={!input.trim()}
            className="btn-primary"
          >
            Rastrear
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
        </div>
      )}

      {isError && (
        <div className="card p-6 text-center text-red-600 text-sm">
          Frete não encontrado. Verifique o ID e tente novamente.
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-900">{data.requester_name}</h2>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{data.id}</p>
              </div>
              <StatusBadge status={data.status} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                  Coleta
                </p>
                <p className="text-gray-800 font-medium">
                  {data.pickup_city}, {data.pickup_state}
                </p>
                <p className="text-gray-600 text-xs">
                  {data.pickup_street}, {data.pickup_number}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                  Entrega
                </p>
                <p className="text-gray-800 font-medium">
                  {data.delivery_city}, {data.delivery_state}
                </p>
                <p className="text-gray-600 text-xs">
                  {data.delivery_street}, {data.delivery_number}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card p-6">
            <h3 className="font-medium text-gray-900 mb-4">Histórico de Status</h3>
            <ol className="relative border-l-2 border-gray-200 ml-3 space-y-5">
              {data.history.map((h, i) => (
                <li key={h.id} className="ml-5">
                  <span
                    className={`absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-white ${
                      i === 0 ? "bg-brand-600" : "bg-gray-300"
                    }`}
                  />
                  <div className="text-sm">
                    <p className="font-medium text-gray-800">{h.to_status}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(h.changed_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                    {h.note && <p className="text-xs text-gray-600 mt-0.5">{h.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
