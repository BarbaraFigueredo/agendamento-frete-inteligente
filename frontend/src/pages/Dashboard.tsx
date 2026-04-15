import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { freightApi } from "../api/freight";
import FreightCard from "../components/freight/FreightCard";
import type { FreightModality, FreightStatus } from "../types/freight";

const STATUS_LABELS: Record<FreightStatus, string> = {
  DRAFT: "Rascunho",
  CONFIRMED: "Confirmado",
  ASSIGNED: "Designado",
  IN_TRANSIT: "Trânsito",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

const MODALITY_LABELS: Record<FreightModality, string> = {
  FTL: "Caminhão",
  LTL: "Fracionado",
  MOTO: "Moto",
  VAN: "Van",
};

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#6b7280"];

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: freightApi.dashboard,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const byStatusData = Object.entries(data?.by_status ?? {}).map(([key, value]) => ({
    name: STATUS_LABELS[key as FreightStatus] ?? key,
    value,
  }));

  const byModalityData = Object.entries(data?.by_modality ?? {}).map(([key, value]) => ({
    name: MODALITY_LABELS[key as FreightModality] ?? key,
    value,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral dos agendamentos de frete</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total de Fretes" value={data?.total ?? 0} color="blue" />
        <StatCard label="Confirmados" value={data?.by_status?.CONFIRMED ?? 0} color="purple" />
        <StatCard label="Em Trânsito" value={data?.by_status?.IN_TRANSIT ?? 0} color="yellow" />
        <StatCard label="Entregues" value={data?.by_status?.DELIVERED ?? 0} color="green" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Fretes por Status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byStatusData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {byStatusData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Fretes por Modalidade</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byModalityData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-4">Fretes Recentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data?.recent?.map((freight) => (
            <FreightCard key={freight.id} freight={freight} />
          ))}
          {(!data?.recent || data.recent.length === 0) && (
            <p className="text-gray-500 text-sm col-span-full">Nenhum frete cadastrado ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "blue" | "purple" | "yellow" | "green";
}) {
  const colorClasses = {
    blue: "text-blue-700",
    purple: "text-purple-700",
    yellow: "text-yellow-700",
    green: "text-green-700",
  };
  return (
    <div className="card p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-4xl font-bold mt-1 ${colorClasses[color]}`}>{value}</p>
    </div>
  );
}
