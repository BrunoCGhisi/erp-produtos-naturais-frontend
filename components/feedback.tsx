"use client";
import {
  AlertCircle,
  PackageOpen,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { errorMessage, isMissing } from "@/lib/errors";
export function ErrorNotice({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  return (
    <div className="notice notice-error" role="alert">
      <AlertCircle size={20} />
      <div>
        <strong>
          {isMissing(error)
            ? "Registro não encontrado"
            : "Não foi possível concluir"}
        </strong>
        <p>{errorMessage(error)}</p>
        {retry && (
          <Button variant="outline" size="sm" onClick={retry}>
            <RefreshCw size={14} />
            Tentar novamente
          </Button>
        )}
        {isMissing(error) && <Link href="/produtos">Voltar aos produtos</Link>}
      </div>
    </div>
  );
}
export function Loading() {
  return (
    <div className="empty" role="status">
      <LoaderCircle className="spin" />
      <p>Carregando registros…</p>
    </div>
  );
}
export function Empty({
  title = "Nenhum registro encontrado",
  description = "Cadastre o primeiro registro para começar.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <PackageOpen size={28} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
export function Status({ value }: { value?: string }) {
  return (
    <span
      className={`badge ${value === "ATIVO" ? "badge-green" : "badge-gray"}`}
    >
      <span />
      {value === "ATIVO" ? "Ativo" : "Inativo"}
    </span>
  );
}
export function Heading({
  eyebrow = "CATÁLOGO",
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
