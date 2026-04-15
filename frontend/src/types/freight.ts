export type FreightStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "ASSIGNED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED";

export type FreightModality = "FTL" | "LTL" | "MOTO" | "VAN";

export interface FreightItem {
  id?: string;
  description: string;
  quantity: number;
  weight_kg: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
}

export interface FreightStatusHistory {
  id: string;
  from_status: string;
  to_status: string;
  note: string;
  changed_at: string;
}

export interface FreightScheduling {
  id: string;
  requester_name: string;
  requester_cpf: string;
  requester_phone: string;
  requester_email: string;
  pickup_street: string;
  pickup_number: string;
  pickup_complement?: string;
  pickup_neighborhood: string;
  pickup_city: string;
  pickup_state: string;
  pickup_zip_code: string;
  delivery_street: string;
  delivery_number: string;
  delivery_complement?: string;
  delivery_neighborhood: string;
  delivery_city: string;
  delivery_state: string;
  delivery_zip_code: string;
  scheduled_date: string;
  modality: FreightModality;
  status: FreightStatus;
  total_weight_kg: string;
  declared_value: string;
  notes?: string;
  items: FreightItem[];
  history: FreightStatusHistory[];
  created_at: string;
  updated_at: string;
}

export type FreightCreate = Omit<
  FreightScheduling,
  "id" | "status" | "history" | "created_at" | "updated_at"
>;

export interface DashboardData {
  total: number;
  by_status: Partial<Record<FreightStatus, number>>;
  by_modality: Partial<Record<FreightModality, number>>;
  recent: FreightScheduling[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
