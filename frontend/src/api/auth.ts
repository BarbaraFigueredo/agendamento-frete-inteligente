import apiClient from "./client";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

export const authApi = {
  login: (data: LoginPayload) =>
    apiClient.post<LoginResponse>("/auth/login/", data).then((r) => r.data),

  refresh: (refresh: string) =>
    apiClient.post<{ access: string }>("/auth/refresh/", { refresh }).then((r) => r.data),

  me: () => apiClient.get("/auth/me/").then((r) => r.data),
};
