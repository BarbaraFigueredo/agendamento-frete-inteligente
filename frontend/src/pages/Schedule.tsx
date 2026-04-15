import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { freightApi } from "../api/freight";

const addressSchema = z.object({
  street: z.string().min(1, "Obrigatório"),
  number: z.string().min(1, "Obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Obrigatório"),
  city: z.string().min(1, "Obrigatório"),
  state: z.string().length(2, "Use a sigla (ex: SP)"),
  zip_code: z.string().regex(/^\d{8}$/, "CEP deve ter 8 dígitos"),
});

const itemSchema = z.object({
  description: z.string().min(1, "Obrigatório"),
  quantity: z.coerce.number().int().min(1),
  weight_kg: z.coerce.number().positive("Deve ser positivo"),
  length_cm: z.coerce.number().positive("Deve ser positivo"),
  width_cm: z.coerce.number().positive("Deve ser positivo"),
  height_cm: z.coerce.number().positive("Deve ser positivo"),
});

const schema = z.object({
  requester_name: z.string().min(3, "Nome obrigatório"),
  requester_cpf: z.string().regex(/^\d{11}$/, "CPF deve ter 11 dígitos"),
  requester_phone: z.string().min(10, "Telefone inválido"),
  requester_email: z.string().email("E-mail inválido"),
  pickup: addressSchema,
  delivery: addressSchema,
  scheduled_date: z.string().min(1, "Data obrigatória"),
  modality: z.enum(["FTL", "LTL", "MOTO", "VAN"]),
  declared_value: z.coerce.number().min(0),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, "Adicione pelo menos 1 item"),
});

type FormData = z.infer<typeof schema>;

const STEPS = ["Solicitante", "Endereços", "Carga & Itens"];

export default function Schedule() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);

  const {
    register,
    handleSubmit,
    control,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      modality: "LTL",
      items: [{ description: "", quantity: 1, weight_kg: 1, length_cm: 1, width_cm: 1, height_cm: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      freightApi.create({
        requester_name: data.requester_name,
        requester_cpf: data.requester_cpf,
        requester_phone: data.requester_phone,
        requester_email: data.requester_email,
        pickup_street: data.pickup.street,
        pickup_number: data.pickup.number,
        pickup_complement: data.pickup.complement,
        pickup_neighborhood: data.pickup.neighborhood,
        pickup_city: data.pickup.city,
        pickup_state: data.pickup.state.toUpperCase(),
        pickup_zip_code: data.pickup.zip_code,
        delivery_street: data.delivery.street,
        delivery_number: data.delivery.number,
        delivery_complement: data.delivery.complement,
        delivery_neighborhood: data.delivery.neighborhood,
        delivery_city: data.delivery.city,
        delivery_state: data.delivery.state.toUpperCase(),
        delivery_zip_code: data.delivery.zip_code,
        scheduled_date: data.scheduled_date,
        modality: data.modality,
        declared_value: String(data.declared_value),
        total_weight_kg: String(
          data.items.reduce((acc, i) => acc + i.weight_kg * i.quantity, 0)
        ),
        notes: data.notes,
        items: data.items,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["freights"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      navigate("/freights");
    },
  });

  const stepFields: (keyof FormData)[][] = [
    ["requester_name", "requester_cpf", "requester_phone", "requester_email"],
    ["pickup", "delivery"],
    ["scheduled_date", "modality", "declared_value", "items"],
  ];

  const handleNext = async () => {
    const valid = await trigger(stepFields[step] as (keyof FormData)[]);
    if (valid) setStep((s) => s + 1);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Novo Agendamento</h1>
        <p className="text-gray-500 text-sm mt-1">Preencha os dados para agendar um frete</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                i === step
                  ? "bg-brand-600 text-white"
                  : i < step
                  ? "bg-brand-200 text-brand-700"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-sm ${i === step ? "font-medium text-gray-900" : "text-gray-500"}`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <div className="card p-6 space-y-4">
          {/* Step 0 — Solicitante */}
          {step === 0 && (
            <>
              <h2 className="font-semibold text-gray-800">Dados do Solicitante</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nome Completo" error={errors.requester_name?.message}>
                  <input
                    {...register("requester_name")}
                    className="input"
                    placeholder="João Silva"
                  />
                </Field>
                <Field label="CPF (somente números)" error={errors.requester_cpf?.message}>
                  <input
                    {...register("requester_cpf")}
                    className="input"
                    placeholder="12345678901"
                    maxLength={11}
                  />
                </Field>
                <Field label="Telefone" error={errors.requester_phone?.message}>
                  <input
                    {...register("requester_phone")}
                    className="input"
                    placeholder="(11) 99999-0000"
                  />
                </Field>
                <Field label="E-mail" error={errors.requester_email?.message}>
                  <input
                    {...register("requester_email")}
                    type="email"
                    className="input"
                    placeholder="joao@empresa.com"
                  />
                </Field>
              </div>
            </>
          )}

          {/* Step 1 — Endereços */}
          {step === 1 && (
            <>
              <AddressSection
                register={register}
                prefix="pickup"
                title="Endereço de Coleta"
                errors={(errors as Record<string, unknown>).pickup as Record<string, { message?: string }> | undefined}
              />
              <hr className="border-gray-200" />
              <AddressSection
                register={register}
                prefix="delivery"
                title="Endereço de Entrega"
                errors={(errors as Record<string, unknown>).delivery as Record<string, { message?: string }> | undefined}
              />
            </>
          )}

          {/* Step 2 — Carga */}
          {step === 2 && (
            <>
              <h2 className="font-semibold text-gray-800">Dados da Carga</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Data Agendada" error={errors.scheduled_date?.message}>
                  <input {...register("scheduled_date")} type="date" className="input" />
                </Field>
                <Field label="Modalidade" error={errors.modality?.message}>
                  <select {...register("modality")} className="input">
                    <option value="LTL">Carga Fracionada</option>
                    <option value="FTL">Caminhão Exclusivo</option>
                    <option value="MOTO">Moto</option>
                    <option value="VAN">Van</option>
                  </select>
                </Field>
                <Field label="Valor Declarado (R$)" error={errors.declared_value?.message}>
                  <input
                    {...register("declared_value")}
                    type="number"
                    step="0.01"
                    className="input"
                    placeholder="0,00"
                  />
                </Field>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-800">Itens</h3>
                  <button
                    type="button"
                    onClick={() =>
                      append({ description: "", quantity: 1, weight_kg: 1, length_cm: 1, width_cm: 1, height_cm: 1 })
                    }
                    className="btn-secondary text-xs py-1"
                  >
                    + Adicionar Item
                  </button>
                </div>

                {errors.items?.root && (
                  <p className="text-xs text-red-600">{errors.items.root.message}</p>
                )}

                {fields.map((field, idx) => (
                  <div key={field.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Item {idx + 1}</span>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(idx)}
                          className="text-red-500 text-xs hover:underline"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="col-span-full">
                        <Field
                          label="Descrição"
                          error={(errors.items?.[idx] as Record<string, { message?: string }> | undefined)?.description?.message}
                        >
                          <input
                            {...register(`items.${idx}.description`)}
                            className="input"
                            placeholder="Caixas de eletrônicos"
                          />
                        </Field>
                      </div>
                      {(
                        [
                          ["quantity", "Qtd"],
                          ["weight_kg", "Peso (kg)"],
                          ["length_cm", "Comp. (cm)"],
                          ["width_cm", "Larg. (cm)"],
                          ["height_cm", "Alt. (cm)"],
                        ] as [keyof typeof field, string][]
                      ).map(([key, lbl]) => (
                        <Field
                          key={key}
                          label={lbl}
                          error={
                            (errors.items?.[idx] as Record<string, { message?: string }> | undefined)?.[key]?.message
                          }
                        >
                          <input
                            {...register(`items.${idx}.${key}` as `items.${number}.quantity`)}
                            type="number"
                            step="0.1"
                            min="0"
                            className="input"
                          />
                        </Field>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <Field label="Observações" error={errors.notes?.message}>
                <textarea
                  {...register("notes")}
                  className="input min-h-[80px] resize-none"
                  placeholder="Informações adicionais..."
                />
              </Field>
            </>
          )}
        </div>

        {mutation.isError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            Erro ao criar agendamento. Verifique os dados e tente novamente.
          </div>
        )}

        <div className="flex justify-between mt-4">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="btn-secondary"
          >
            Voltar
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={handleNext} className="btn-primary">
              Próximo
            </button>
          ) : (
            <button type="submit" disabled={mutation.isPending} className="btn-primary">
              {mutation.isPending ? "Agendando…" : "Confirmar Agendamento"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function AddressSection({
  register,
  prefix,
  title,
  errors,
}: {
  register: ReturnType<typeof useForm<FormData>>["register"];
  prefix: "pickup" | "delivery";
  title: string;
  errors?: Record<string, { message?: string }>;
}) {
  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-gray-800">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Logradouro" error={errors?.street?.message}>
          <input {...register(`${prefix}.street`)} className="input" placeholder="Rua das Flores" />
        </Field>
        <Field label="Número" error={errors?.number?.message}>
          <input {...register(`${prefix}.number`)} className="input" placeholder="123" />
        </Field>
        <Field label="Complemento" error={errors?.complement?.message}>
          <input
            {...register(`${prefix}.complement`)}
            className="input"
            placeholder="Apto 4B (opcional)"
          />
        </Field>
        <Field label="Bairro" error={errors?.neighborhood?.message}>
          <input {...register(`${prefix}.neighborhood`)} className="input" placeholder="Centro" />
        </Field>
        <Field label="Cidade" error={errors?.city?.message}>
          <input {...register(`${prefix}.city`)} className="input" placeholder="São Paulo" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="UF" error={errors?.state?.message}>
            <input
              {...register(`${prefix}.state`)}
              className="input"
              placeholder="SP"
              maxLength={2}
            />
          </Field>
          <Field label="CEP" error={errors?.zip_code?.message}>
            <input
              {...register(`${prefix}.zip_code`)}
              className="input"
              placeholder="01310100"
              maxLength={8}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
