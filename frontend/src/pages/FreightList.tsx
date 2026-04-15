import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { freightApi } from "../api/freight";
import FreightCard from "../components/freight/FreightCard";
import StatusBadge from "../components/freight/StatusBadge";
import type { FreightStatus } from "../types/freight";

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "DRAFT", label: "Rascunho" },
  { value: "CONFIRMED", label: "Confirmado" },
  { value: "ASSIGNED", label: "Designado" },
  { value: "IN_TRANSIT", label: "Em Trânsito" },
  { value: "DELIVERED", label: "Entregue" },
  { value: "CANCELLED", label: "Cancelado" },
];

const NEXT_STATUSES: Record<FreightStatus, FreightStatus[]> = {
  DRAFT:      ["CONFIRMED", "CANCELLED"],
  CONFIRMED:  ["ASSIGNED",  "CANCELLED"],
  ASSIGNED:   ["IN_TRANSIT","CANCELLED"],
  IN_TRANSIT: ["DELIVERED"],
  DELIVERED:  [],
  CANCELLED:  [],
};

export default function FreightListPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["freights", statusFilter],
    queryFn: () => freightApi.list({ status: statusFilter || undefined }),
  });

  const { data: selected } = useQuery({
    queryKey: ["freight", selectedId],
    queryFn: () => freightApi.get(selectedId!),
    enabled: !!selectedId,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      freightApi.updateStatus(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["freights"] });
      queryClient.invalidateQueries({ queryKey: ["freight", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fretes</h1>
          <p className="text-gray-500 text-sm mt-1">{data?.count ?? 0} agendamentos encontrados</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                statusFilter === opt.value
                  ? "bg-brand-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data?.results?.map((freight) => (
            <FreightCard
              key={freight.id}
              freight={freight}
              onClick={() => setSelectedId(freight.id)}
            />
          ))}
          {(!data?.results || data.results.length === 0) && (
            <p className="text-gray-500 text-sm col-span-full text-center py-12">
              Nenhum frete encontrado.
            </p>
          )}
        </div>
      )}

      {/* Detail drawer */}
      {selectedId && selected && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex justify-end"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="bg-white w-full max-w-lg h-full overflow-y-auto p-6 space-y-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Detalhes do Frete</h2>
              <button
                onClick={() => setSelectedId(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={selected.status} />
              <span className="text-xs text-gray-500 font-mono">{selected.id}</span>
            </div>

            <Section title="Solicitante">
              <Row label="Nome" value={selected.requester_name} />
              <Row label="CPF" value={selected.requester_cpf} />
              <Row label="E-mail" value={selected.requester_email} />
              <Row label="Telefone" value={selected.requester_phone} />
            </Section>

            <Section title="Coleta">
              <Row label="Endereço" value={`${selected.pickup_street}, ${selected.pickup_number}`} />
              <Row label="Cidade" value={`${selected.pickup_city} — ${selected.pickup_state}`} />
              <Row label="CEP" value={selected.pickup_zip_code} />
            </Section>

            <Section title="Entrega">
              <Row label="Endereço" value={`${selected.delivery_street}, ${selected.delivery_number}`} />
              <Row label="Cidade" value={`${selected.delivery_city} — ${selected.delivery_state}`} />
              <Row label="CEP" value={selected.delivery_zip_code} />
            </Section>

            <Section title="Itens">
              {selected.items.map((item, i) => (
                <p key={i} className="text-sm text-gray-700">
                  {item.quantity}× {item.description} — {item.weight_kg} kg
                </p>
              ))}
            </Section>

            <Section title="Avançar Status">
              <div className="flex flex-wrap gap-2">
                {NEXT_STATUSES[selected.status].map((s) => (
                  <button
                    key={s}
                    onClick={() => statusMutation.mutate({ id: selected.id, status: s })}
                    disabled={statusMutation.isPending}
                    className="btn-primary text-xs py-1 px-3"
                  >
                    → {s}
                  </button>
                ))}
                {NEXT_STATUSES[selected.status].length === 0 && (
                  <p className="text-xs text-gray-500">Nenhuma transição disponível.</p>
                )}
              </div>
            </Section>

            <Section title="Histórico">
              {selected.history.map((h) => (
                <div key={h.id} className="text-xs text-gray-600 space-y-0.5">
                  <p>
                    <span className="font-medium">{h.from_status || "—"} → {h.to_status}</span>
                    {" · "}
                    {format(new Date(h.changed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                  {h.note && <p className="text-gray-500 pl-2">{h.note}</p>}
                </div>
              ))}
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  );
}
