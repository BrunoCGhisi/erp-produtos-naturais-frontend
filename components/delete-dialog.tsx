"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/feedback";
import { deleteRecord, type Resource } from "@/lib/catalog";
import { refreshCatalog } from "@/lib/queries";
export function DeleteDialog({
  resource,
  id,
  name,
  onClose,
  onDeleted,
}: {
  resource: Resource;
  id: string;
  name: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [opener] = useState(() =>
    typeof document !== "undefined"
      ? (document.activeElement as HTMLElement)
      : null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>();
  const client = useQueryClient();
  async function remove() {
    setSaving(true);
    setError(undefined);
    try {
      await deleteRecord(resource, id);
      await refreshCatalog(client);
      onDeleted();
    } catch (e) {
      setError(e);
    } finally {
      setSaving(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <DialogContent
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          if (opener?.isConnected) opener.focus();
          else document.getElementById("conteudo")?.focus();
        }}
        onEscapeKeyDown={(e) => {
          if (saving) e.preventDefault();
        }}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle>
          {resource === "assignments"
            ? "Desvincular loja?"
            : "Excluir registro?"}
        </DialogTitle>
        <DialogDescription>
          Confirme a remoção de <span className="delete-name">{name}</span>.
          Esta ação não pode ser desfeita. Registros referenciados podem ter a
          exclusão bloqueada pelo backend.
        </DialogDescription>
        {!!error && <ErrorNotice error={error} />}
        <div className="form-actions">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            autoFocus
          >
            Cancelar
          </Button>
          <Button variant="destructive" onClick={remove} disabled={saving}>
            {saving
              ? "Removendo…"
              : resource === "assignments"
                ? "Desvincular"
                : "Excluir"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
