import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/auth";
import { useAuthStore } from "../store/authStore";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setTokens(data.access, data.refresh);
      setUser(data.user);
      navigate("/dashboard");
    },
    onError: () => {
      setError("E-mail ou senha incorretos.");
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 to-brand-700 flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-8">
          <svg className="w-9 h-9 text-brand-600" viewBox="0 0 32 32" fill="none">
            <rect x="2" y="8" width="28" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
            <path
              d="M8 14 L14 20 L24 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900">FreightFlow</h1>
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-1">Entrar na sua conta</h2>
        <p className="text-sm text-gray-500 mb-6">Sistema de Agendamento de Frete</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">E-mail</label>
            <input
              {...register("email")}
              type="email"
              className="input"
              placeholder="voce@empresa.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="label">Senha</label>
            <input
              {...register("password")}
              type="password"
              className="input"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary w-full justify-center py-2.5"
          >
            {mutation.isPending ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
