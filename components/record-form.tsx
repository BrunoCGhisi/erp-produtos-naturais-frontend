"use client";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useId, useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import {
  fields,
  schemas,
  initialValues,
  saveRecord,
  type Resource,
  type Values,
  type Field,
} from "@/lib/catalog";
import { refreshCatalog } from "@/lib/queries";
import { ErrorNotice } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
export function RecordForm({
  resource,
  initial,
  extra = {},
  fieldOptions = {},
  onSaved,
  onCancel,
  disabled = false,
  onBusyChange,
}: {
  resource: Resource;
  initial?: Record<string, unknown>;
  extra?: Values;
  fieldOptions?: Record<string, Field["options"]>;
  onSaved: (row: unknown) => void;
  onCancel: () => void;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const formId = useId();
  const queryClient = useQueryClient();
  const [requestError, setRequestError] = useState<unknown>();
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    defaultValues: { ...initialValues(resource, initial), ...extra },
  });
  useEffect(() => {
    onBusyChange?.(isSubmitting);
  }, [isSubmitting, onBusyChange]);
  const submit = handleSubmit(async (values) => {
    setRequestError(undefined);
    clearErrors();
    const parsed = schemas[resource].safeParse({ ...values, ...extra });
    if (!parsed.success) {
      for (const [index, issue] of parsed.error.issues.entries())
        setError(
          String(issue.path[0]),
          { message: issue.message },
          { shouldFocus: index === 0 },
        );
      return;
    }
    try {
      const saved = await saveRecord(
        resource,
        { ...values, ...extra },
        typeof initial?.id === "string" ? initial.id : undefined,
      );
      await refreshCatalog(queryClient);
      onSaved(saved);
    } catch (error) {
      setRequestError(error);
    }
  });
  return (
    <form onSubmit={submit} noValidate aria-busy={isSubmitting}>
      {!!requestError && <ErrorNotice error={requestError} />}
      <div className="form-grid">
        {(fields[resource] as Field[]).map((f) => {
          const id = `${formId}-${f.name}`,
            options = fieldOptions[f.name] || f.options;
          const attrs = {
            id,
            ...register(f.name),
            "aria-invalid": !!errors[f.name],
            "aria-required": !f.optional,
            "aria-describedby": errors[f.name]
              ? `${id}-error`
              : f.hint
                ? `${id}-hint`
                : undefined,
            disabled: isSubmitting || disabled,
          };
          return (
            <div
              key={f.name}
              className={`field ${f.type === "textarea" || f.name === "nome" || f.name === "sku" ? "full" : ""}`}
            >
              <label htmlFor={id}>
                {f.label}
                {!f.optional && <span aria-hidden="true"> *</span>}
              </label>
              {f.type === "select" ? (
                <select {...attrs}>
                  <option value="">Selecione…</option>
                  {options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : f.type === "textarea" ? (
                <textarea {...attrs} />
              ) : (
                <input
                  {...attrs}
                  type={f.type || "text"}
                  inputMode={
                    f.name === "preco"
                      ? "decimal"
                      : f.name === "ean13" || f.name === "dun14"
                        ? "numeric"
                        : undefined
                  }
                />
              )}
              {f.hint && <small id={`${id}-hint`}>{f.hint}</small>}
              {errors[f.name] && (
                <p id={`${id}-error`} className="field-error">
                  {errors[f.name]?.message}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <div className="form-actions">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || disabled}>
          {isSubmitting && <LoaderCircle size={16} className="spin" />}
          {isSubmitting ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
export function RecordModal({
  title,
  description,
  onClose,
  ...props
}: Omit<React.ComponentProps<typeof RecordForm>, "onCancel"> & {
  title: string;
  description?: string;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [opener] = useState(() =>
    typeof document !== "undefined"
      ? (document.activeElement as HTMLElement)
      : null,
  );
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          if (opener?.isConnected) opener.focus();
          else document.getElementById("conteudo")?.focus();
        }}
        onEscapeKeyDown={(e) => {
          if (busy) e.preventDefault();
        }}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {description ||
            "Preencha os campos abaixo. Campos com * são obrigatórios."}
        </DialogDescription>
        <RecordForm {...props} onBusyChange={setBusy} onCancel={onClose} />
      </DialogContent>
    </Dialog>
  );
}
