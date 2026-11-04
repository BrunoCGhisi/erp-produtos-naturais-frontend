"use client";
import { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useListarCategorias } from "@/generated/sdk/hooks/useListarCategorias";
import { useListarUnidadesMedida } from "@/generated/sdk/hooks/useListarUnidadesMedida";
import { useListarLojas } from "@/generated/sdk/hooks/useListarLojas";
import { Heading, Loading, Empty, ErrorNotice } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { RecordModal } from "@/components/record-form";
import { DeleteDialog } from "@/components/delete-dialog";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { resourceNames } from "@/lib/catalog";
type SupportResource = "categories" | "units" | "stores";
type Row = {
  id?: string;
  nome?: string;
  sigla?: string;
  nomeFantasia?: string;
  razaoSocial?: string;
  cnpj?: string;
  estado?: string;
  cidade?: string;
  [key: string]: unknown;
};
export function SupportList({ resource }: { resource: SupportResource }) {
  const categories = useListarCategorias({
    query: { enabled: resource === "categories" },
  });
  const units = useListarUnidadesMedida({
    query: { enabled: resource === "units" },
  });
  const stores = useListarLojas({ query: { enabled: resource === "stores" } });
  const query =
    resource === "categories"
      ? categories
      : resource === "units"
        ? units
        : stores;
  const params = useSearchParams(),
    router = useRouter(),
    pathname = usePathname();
  const search = params.get("busca") || "",
    sort = params.get("ordem") || "asc";
  function control(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "pagina") next.delete("pagina");
    router.replace(`${pathname}?${next}`, { scroll: false });
  }
  const [edit, setEdit] = useState<Row | null | undefined>(),
    [remove, setRemove] = useState<Row>(),
    [success, setSuccess] = useState("");
  const names = resourceNames[resource];
  const filtered = (query.data || [])
    .filter((r: Row) =>
      JSON.stringify(r)
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")),
    )
    .sort(
      (a: Row, b: Row) =>
        String(a.nome || a.nomeFantasia).localeCompare(
          String(b.nome || b.nomeFantasia),
          "pt-BR",
        ) * (sort === "desc" ? -1 : 1),
    );
  const pages = Math.max(1, Math.ceil(filtered.length / 20)),
    page = Math.min(
      pages,
      Math.max(1, Math.trunc(Number(params.get("pagina"))) || 1),
    );
  const rows = filtered.slice((page - 1) * 20, page * 20);
  const title =
    resource === "units"
      ? "Nova unidade de medida"
      : resource === "categories"
        ? "Nova categoria"
        : "Nova loja";
  return (
    <>
      <Heading
        title={names.plural}
        description={
          resource === "categories"
            ? "Organize os produtos em categorias para facilitar o dia a dia."
            : resource === "units"
              ? "Defina as unidades utilizadas no cadastro dos produtos."
              : "Cadastre as lojas que fazem parte da Vila Verde."
        }
        action={
          <Button
            onClick={() => {
              setSuccess("");
              setEdit(null);
            }}
          >
            <Plus size={16} />
            {title}
          </Button>
        }
      />
      {success && (
        <p role="status" className="success">
          {success}
        </p>
      )}
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>{names.plural} cadastradas</h2>
            <p>{query.data?.length || 0} registros no catálogo</p>
          </div>
        </div>
        <div className="toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              aria-label={`Buscar ${names.plural.toLowerCase()}`}
              placeholder="Buscar por nome…"
              value={search}
              onChange={(e) => control("busca", e.target.value)}
            />
          </div>
          <select
            aria-label="Ordenar registros"
            value={sort}
            onChange={(e) => control("ordem", e.target.value)}
          >
            <option value="asc">Nome: A–Z</option>
            <option value="desc">Nome: Z–A</option>
          </select>
        </div>
        {query.isPending ? (
          <Loading />
        ) : query.isError ? (
          <div className="p-5">
            <ErrorNotice
              error={query.error}
              retry={() => void query.refetch()}
            />
          </div>
        ) : rows.length === 0 ? (
          <Empty
            description={
              search
                ? "Nenhum resultado para a busca informada."
                : "Cadastre o primeiro registro para começar."
            }
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>NOME</th>
                  {resource === "units" && <th>SIGLA</th>}
                  {resource === "stores" && (
                    <>
                      <th>CNPJ</th>
                      <th>CIDADE / UF</th>
                    </>
                  )}
                  <th className="text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: Row) => (
                  <tr key={row.id}>
                    <td className="row-title">
                      {row.nome || row.nomeFantasia}
                    </td>
                    {resource === "units" && <td>{row.sigla}</td>}
                    {resource === "stores" && (
                      <>
                        <td>{row.cnpj}</td>
                        <td>
                          {row.cidade} / {row.estado}
                        </td>
                      </>
                    )}
                    <td>
                      <div className="actions">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Editar ${row.nome || row.nomeFantasia}`}
                          onClick={() => setEdit(row)}
                        >
                          <Pencil size={15} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Excluir ${row.nome || row.nomeFantasia}`}
                          onClick={() => setRemove(row)}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {query.isSuccess && (
          <div className="pagination">
            <span>{filtered.length} registros</span>
            <div className="pagination-controls">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => control("pagina", String(page - 1))}
              >
                Anterior
              </Button>
              <span>
                Página {page} de {pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pages}
                onClick={() => control("pagina", String(page + 1))}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>
      {edit !== undefined && (
        <RecordModal
          resource={resource}
          initial={edit || undefined}
          title={edit ? `Editar ${names.singular}` : title}
          onClose={() => setEdit(undefined)}
          onSaved={() => {
            setEdit(undefined);
            setSuccess("Registro salvo com sucesso.");
          }}
        />
      )}
      {remove?.id && (
        <DeleteDialog
          resource={resource}
          id={remove.id}
          name={String(remove.nome || remove.nomeFantasia)}
          onClose={() => setRemove(undefined)}
          onDeleted={() => {
            setRemove(undefined);
            setSuccess("Registro excluído.");
          }}
        />
      )}
    </>
  );
}
