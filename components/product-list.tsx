"use client";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import {
  Package,
  CircleCheck,
  Tags,
  Plus,
  Search,
  Pencil,
  Trash2,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Leaf,
} from "lucide-react";
import { useListarProdutos } from "@/generated/sdk/hooks/useListarProdutos";
import { useListarCategorias } from "@/generated/sdk/hooks/useListarCategorias";
import type { ProdutoResponseDTO } from "@/generated/sdk/types/ProdutoResponseDTO";
import {
  Heading,
  Loading,
  Empty,
  ErrorNotice,
  Status,
} from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { DeleteDialog } from "@/components/delete-dialog";
export function ProductList() {
  const query = useListarProdutos(),
    categories = useListarCategorias();
  const params = useSearchParams(),
    router = useRouter(),
    path = usePathname();
  const search = params.get("busca") || "",
    category = params.get("categoria") || "",
    status = params.get("status") || "",
    sort = params.get("ordem") || "asc";
  const [remove, setRemove] = useState<ProdutoResponseDTO>(),
    [success, setSuccess] = useState("");
  function control(name: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    if (name !== "pagina") next.delete("pagina");
    router.replace(`${path}?${next}`, { scroll: false });
  }
  const all = query.data || [];
  const filtered = all
    .filter(
      (row) =>
        (row.nome || "")
          .toLocaleLowerCase("pt-BR")
          .includes(search.toLocaleLowerCase("pt-BR")) &&
        (!category || row.idCategoria === category) &&
        (!status || row.status === status),
    )
    .sort(
      (a, b) =>
        (a.nome || "").localeCompare(b.nome || "", "pt-BR") *
        (sort === "desc" ? -1 : 1),
    );
  const pages = Math.max(1, Math.ceil(filtered.length / 20)),
    page = Math.min(
      pages,
      Math.max(1, Math.trunc(Number(params.get("pagina"))) || 1),
    );
  const rows = filtered.slice((page - 1) * 20, page * 20);
  return (
    <>
      <Heading
        title="Produtos"
        description="Organize seu catálogo e cuide de cada detalhe dos seus produtos."
        action={
          <Button asChild>
            <Link href="/produtos/novo">
              <Plus size={17} />
              Novo produto
            </Link>
          </Button>
        }
      />
      <div className="summary-grid">
        {[
          {
            title: "Total de produtos",
            value: query.isSuccess ? all.length : "—",
            icon: Package,
          },
          {
            title: "Produtos ativos",
            value: query.isSuccess
              ? all.filter((x) => x.status === "ATIVO").length
              : "—",
            icon: CircleCheck,
          },
          {
            title: "Categorias cadastradas",
            value: categories.isSuccess ? categories.data.length : "—",
            icon: Tags,
          },
        ].map(({ title, value, icon: Icon }) => (
          <div className="summary-card" key={title}>
            <div>
              <p>{title}</p>
              <strong>{value}</strong>
            </div>
            <span className="summary-icon">
              <Icon size={22} />
            </span>
          </div>
        ))}
      </div>
      {success && (
        <p role="status" className="success">
          {success}
        </p>
      )}
      {categories.isError && (
        <ErrorNotice
          error={categories.error}
          retry={() => void categories.refetch()}
        />
      )}
      <section className="panel" aria-label="Catálogo de produtos">
        <div className="panel-header">
          <div>
            <h2>Seu catálogo</h2>
            <p>Todos os produtos, em um só lugar.</p>
          </div>
          <span className="badge badge-gray">
            {query.isSuccess ? `${all.length} produtos` : "Produtos"}
          </span>
        </div>
        <div className="toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              aria-label="Buscar produtos"
              placeholder="Buscar por nome do produto…"
              value={search}
              onChange={(e) => control("busca", e.target.value)}
            />
          </div>
          <select
            aria-label="Filtrar por categoria"
            value={category}
            onChange={(e) => control("categoria", e.target.value)}
          >
            <option value="">Todas as categorias</option>
            {categories.data?.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nome}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar por status"
            value={status}
            onChange={(e) => control("status", e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
          </select>
          <select
            aria-label="Ordenar produtos"
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
            title="Nenhum produto encontrado"
            description={
              search || category || status
                ? "Ajuste os filtros para encontrar outros produtos."
                : "Comece pelas categorias e unidades de medida. Depois, cadastre seu primeiro produto."
            }
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>PRODUTO</th>
                  <th>CATEGORIA</th>
                  <th>UNIDADE</th>
                  <th>TIPO DE VENDA</th>
                  <th>STATUS</th>
                  <th className="text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="product-cell">
                        <span className="product-icon">
                          <Leaf size={17} />
                        </span>
                        <div>
                          <Link
                            className="row-title"
                            href={`/produtos/${row.id}`}
                          >
                            {row.nome}
                          </Link>
                          <small className="row-id">
                            #{row.id?.slice(0, 8)}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      {row.nomeCategoria ||
                        categories.data?.find((x) => x.id === row.idCategoria)
                          ?.nome ||
                        "—"}
                    </td>
                    <td>{row.siglaUnidadeMedida || "—"}</td>
                    <td>{row.tipoVenda === "PESO" ? "Peso" : "Unidade"}</td>
                    <td>
                      <Status value={row.status} />
                    </td>
                    <td>
                      <div className="actions">
                        <Button asChild variant="ghost" size="icon">
                          <Link
                            aria-label={`Abrir ${row.nome}`}
                            href={`/produtos/${row.id}`}
                          >
                            <ArrowUpRight size={16} />
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="icon">
                          <Link
                            aria-label={`Editar ${row.nome}`}
                            href={`/produtos/${row.id}/editar`}
                          >
                            <Pencil size={14} />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Excluir ${row.nome}`}
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
            <span>
              {filtered.length
                ? `${(page - 1) * 20 + 1}–${Math.min(page * 20, filtered.length)} de ${filtered.length} produtos`
                : "0 produtos"}
            </span>
            <div className="pagination-controls">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => control("pagina", String(page - 1))}
              >
                <ChevronLeft size={14} />
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
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </section>
      {remove?.id && (
        <DeleteDialog
          resource="products"
          id={remove.id}
          name={remove.nome || "produto"}
          onClose={() => setRemove(undefined)}
          onDeleted={() => {
            setRemove(undefined);
            setSuccess("Produto excluído.");
          }}
        />
      )}
    </>
  );
}
