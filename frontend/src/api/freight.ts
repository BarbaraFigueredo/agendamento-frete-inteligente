import apiClient from "./client";
import type {
  DashboardData,
  FreightCreate,
  FreightScheduling,
  PaginatedResponse,
} from "../types/freight";

export const freightApi = {
  list: (params?: { status?: string; cpf?: string; page?: number }) =>
    apiClient
      .get<PaginatedResponse<FreightScheduling>>("/freight/", { params })
      .then((r) => r.data),

  get: (id: string) =>
    apiClient.get<FreightScheduling>(`/freight/${id}/`).then((r) => r.data),

  create: (data: FreightCreate) =>
    apiClient.post<FreightScheduling>("/freight/", data).then((r) => r.data),

  update: (id: string, data: Partial<FreightCreate>) =>
    apiClient.patch<FreightScheduling>(`/freight/${id}/`, data).then((r) => r.data),

  updateStatus: (id: string, status: string, note?: string) =>
    apiClient
      .patch<FreightScheduling>(`/freight/${id}/status/`, { status, note })
      .then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/freight/${id}/`),

  dashboard: () => apiClient.get<DashboardData>("/freight/dashboard/").then((r) => r.data),
};
