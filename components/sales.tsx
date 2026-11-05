"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useListarVendas } from "@/generated/sdk/hooks/useListarVendas";
import { useBuscarVendaPorId } from "@/generated/sdk/hooks/useBuscarVendaPorId";
import { useListarUsuarios } from "@/generated/sdk/hooks/useListarUsuarios";
import { useListarUnidadesMedida } from "@/generated/sdk/hooks/useListarUnidadesMedida";
import { useListarClientes } from "@/generated/sdk/hooks/useListarClientes";
import { useListarLojas } from "@/generated/sdk/hooks/useListarLojas";
import { useListarProdutos } from "@/generated/sdk/hooks/useListarProdutos";
import { criarVenda } from "@/generated/sdk/clients/criarVenda";
import { Heading, Loading, Empty, ErrorNotice } from "./feedback";
import { Button } from "./ui/button";
import { Input, Select } from "./ui/input";
import { Panel } from "./ui/panel";
import { Table, TableRow, TableHead, TableCell } from "./ui/table";
import { refreshCatalog } from "@/lib/queries";
import { currency } from "@/lib/validation";
import {
  inDateRange,
  timestamp,
  quantity,
  inventoryInstant,
} from "@/lib/inventory";
import {
  blankItem,
  draftValues,
  itemCalculation,
  salePayload,
  saleStatus,
  statusLabels,
  totals,
} from "@/lib/sales";
const inventoryHint =
  "Registrar uma venda aberta não conclui o checkout nem baixa o estoque. Vendas salvas são somente leitura.";
function useLookups() {
  const users = useListarUsuarios(),
    units = useListarUnidadesMedida(),
    customers = useListarClientes(),
    stores = useListarLojas(),
    products = useListarProdutos();
  return { customers, stores, products, users, units };
}
function LookupErrors({ lookups }: { lookups: ReturnType<typeof useLookups> }) {
  return (
    <>
      {Object.entries(lookups).map(
        ([name, query]) =>
          query.isError && (
            <div key={name}>
              <p>
                {
                  {
                    users: "Operadores",
                    units: "Unidades de medida",
                    customers: "Clientes",
                    stores: "Lojas",
                    products: "Produtos",
                  }[name]
                }
              </p>
              <ErrorNotice
                error={query.error}
                retry={() => void query.refetch()}
              />
            </div>
          ),
      )}
    </>
  );
}
export function SaleList() {
  const lookups = useLookups();
  const params = useSearchParams(),
    path = usePathname();
  const value = (key: string) => params.get(key) || "";
  const query = useListarVendas({
    query: {
      ...(value("idCliente") ? { idCliente: value("idCliente") } : {}),
      ...(value("idLoja") ? { idLoja: value("idLoja") } : {}),
    },
  });
  function control(key: string, v: string) {
    const next = new URLSearchParams(window.location.search);
    if (v) next.set(key, v);
    else next.delete(key);
    if (key !== "pagina") next.delete("pagina");
    window.history.replaceState(null, "", `${path}?${next}`);
  }
  const customers = lookups.customers.data || [],
    stores = lookups.stores.data || [];
  const customerName = (id?: string) =>
    customers.find((s) => s.id === id)?.nome || id || "—";
  const storeName = (id?: string) =>
    stores.find((s) => s.id === id)?.nomeFantasia || id || "—";
  const sort = value("ordem") || "data-desc";
  const rows = [...(query.data || [])]
    .filter(
      (r) =>
        (!value("idCliente") || r.idCliente === value("idCliente")) &&
        (!value("idLoja") || r.idLoja === value("idLoja")) &&
        (!value("status") || r.status === value("status")) &&
        inDateRange(r.dataVenda, value("inicio"), value("fim")),
    )
    .sort((a, b) => {
      const direction = sort.endsWith("asc") ? 1 : -1;
      const diff = sort.startsWith("total")
        ? (a.valorTotal ?? 0) - (b.valorTotal ?? 0)
        : sort.startsWith("cliente")
          ? customerName(a.idCliente).localeCompare(
              customerName(b.idCliente),
              "pt-BR",
            )
          : sort.startsWith("loja")
            ? storeName(a.idLoja).localeCompare(storeName(b.idLoja), "pt-BR")
            : sort.startsWith("status")
              ? saleStatus(a.status).localeCompare(
                  saleStatus(b.status),
                  "pt-BR",
                )
              : (a.dataVenda ? inventoryInstant(a.dataVenda).getTime() : 0) -
                (b.dataVenda ? inventoryInstant(b.dataVenda).getTime() : 0);
      return direction * (diff || (a.id || "").localeCompare(b.id || ""));
    });
  const pages = Math.max(1, Math.ceil(rows.length / 20)),
    page = Math.min(
      pages,
      Math.max(1, Math.trunc(Number(value("pagina"))) || 1),
    );
  return (
    <>
      <Heading
        eyebrow="VENDAS"
        title="Registros de vendas"
        description="Prepare vendas e consulte os totais salvos."
        action={
          <Button asChild>
            <Link href="/vendas/nova">Nova venda</Link>
          </Button>
        }
      />
      <LookupErrors lookups={lookups} />
      <Panel>
        <div className="grid grid-cols-3 gap-4 p-5 mobile:grid-cols-1">
          <label>
            Cliente
            <Select
              aria-label="Cliente"
              value={value("idCliente")}
              onChange={(e) => control("idCliente", e.target.value)}
            >
              <option value="">Todos os clientes</option>
              {customers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Loja
            <Select
              aria-label="Loja"
              value={value("idLoja")}
              onChange={(e) => control("idLoja", e.target.value)}
            >
              <option value="">Todas as lojas</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nomeFantasia}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Status
            <Select
              aria-label="Status"
              value={value("status")}
              onChange={(e) => control("status", e.target.value)}
            >
              <option value="">Todos os status</option>
              {[
                ...new Set([
                  ...Object.keys(statusLabels),
                  ...(query.data || []).flatMap((r) =>
                    r.status ? [r.status] : [],
                  ),
                ]),
              ].map((s) => (
                <option key={s} value={s}>
                  {saleStatus(s)}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Data inicial
            <Input
              type="date"
              value={value("inicio")}
              onChange={(e) => control("inicio", e.target.value)}
            />
          </label>
          <label>
            Data final
            <Input
              type="date"
              value={value("fim")}
              onChange={(e) => control("fim", e.target.value)}
            />
          </label>
          <label>
            Ordenar vendas
            <Select
              aria-label="Ordenar vendas"
              value={sort}
              onChange={(e) => control("ordem", e.target.value)}
            >
              {[
                ["data", "Data"],
                ["cliente", "Cliente"],
                ["loja", "Loja"],
                ["status", "Status"],
                ["total", "Total"],
              ].flatMap(([key, label]) =>
                ["desc", "asc"].map((dir) => (
                  <option key={key + dir} value={`${key}-${dir}`}>
                    {label}: {dir === "desc" ? "decrescente" : "crescente"}
                  </option>
                )),
              )}
            </Select>
          </label>
        </div>
        {query.isPending ? (
          <Loading />
        ) : query.isError && !query.data ? (
          <ErrorNotice error={query.error} retry={() => void query.refetch()} />
        ) : !rows.length ? (
          <Empty />
        ) : (
          <Table>
            <thead>
              <TableRow>
                {[
                  "CLIENTE",
                  "OPERADOR",
                  "LOJA",
                  "DATA",
                  "STATUS",
                  "TOTAL SALVO",
                  "AÇÕES",
                ].map((t) => (
                  <TableHead key={t}>{t}</TableHead>
                ))}
              </TableRow>
            </thead>
            <tbody>
              {rows.slice((page - 1) * 20, page * 20).map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{customerName(r.idCliente)}</TableCell>
                  <TableCell>
                    {r.nomeUsuario ||
                      lookups.users.data?.find((u) => u.id === r.idUsuario)
                        ?.nome ||
                      r.idUsuario ||
                      "—"}
                  </TableCell>
                  <TableCell>{storeName(r.idLoja)}</TableCell>
                  <TableCell>{timestamp(r.dataVenda)}</TableCell>
                  <TableCell>{saleStatus(r.status)}</TableCell>
                  <TableCell>{currency(r.valorTotal)}</TableCell>
                  <TableCell>
                    <Link href={`/vendas/${r.id}`}>Ver venda</Link>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        )}
        <div className="flex items-center justify-end gap-4 p-5">
          <Button
            variant="outline"
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
            disabled={page >= pages}
            onClick={() => control("pagina", String(page + 1))}
          >
            Próxima
          </Button>
        </div>
      </Panel>
    </>
  );
}
export function SaleRecord({ id }: { id: string }) {
  const query = useBuscarVendaPorId({ path: { id } });
  const lookups = useLookups();
  if (query.isPending) return <Loading />;
  if (query.isError && !query.data)
    return (
      <ErrorNotice error={query.error} retry={() => void query.refetch()} />
    );
  if (!query.data) return <Empty title="Venda não encontrada" />;
  const row = query.data;
  const refreshError = query.isError ? (
    <ErrorNotice error={query.error} retry={() => void query.refetch()} />
  ) : null;
  return (
    <>
      <Heading
        eyebrow="VENDAS"
        title="Detalhes da venda"
        description={inventoryHint}
      />
      {refreshError}
      <LookupErrors lookups={lookups} />
      <Panel className="space-y-4 p-5">
        <p>
          Cliente:{" "}
          {lookups.customers.data?.find((s) => s.id === row.idCliente)?.nome ||
            row.idCliente ||
            "—"}
        </p>
        <p>
          Loja:{" "}
          {lookups.stores.data?.find((s) => s.id === row.idLoja)
            ?.nomeFantasia ||
            row.idLoja ||
            "—"}
        </p>
        <p>Data: {timestamp(row.dataVenda)}</p>
        <p>Status: {saleStatus(row.status)}</p>
        <p>
          Operador:{" "}
          {row.nomeUsuario ||
            lookups.users.data?.find((u) => u.id === row.idUsuario)?.nome ||
            row.idUsuario ||
            "—"}
        </p>
        <p>Subtotal salvo: {currency(row.subtotal)}</p>
        <p>Desconto total salvo: {currency(row.descontoTotal)}</p>
        <p>
          Total salvo: <strong>{currency(row.valorTotal)}</strong>
        </p>
      </Panel>
      <p className="my-4">
        A API não retorna o total persistido de cada item nem a unidade
        histórica. A unidade abaixo é a atual do catálogo.
      </p>
      <Table>
        <thead>
          <TableRow>
            {[
              "PRODUTO",
              "QUANTIDADE",
              "PREÇO UNITÁRIO",
              "DESCONTO",
              "UNIDADE ATUAL (CATÁLOGO)",
            ].map((t) => (
              <TableHead key={t}>{t}</TableHead>
            ))}
          </TableRow>
        </thead>
        <tbody>
          {row.itens?.map((i, index) => (
            <TableRow key={i.id || index}>
              <TableCell>
                {lookups.products.data?.find((p) => p.id === i.idProduto)
                  ?.nome ||
                  i.idProduto ||
                  "—"}
              </TableCell>
              <TableCell>{quantity(i.quantidade)}</TableCell>
              <TableCell>{currency(i.precoUnitario)}</TableCell>
              <TableCell>{currency(i.desconto)}</TableCell>
              <TableCell>
                {lookups.units.data?.find(
                  (u) =>
                    u.id ===
                    lookups.products.data?.find((p) => p.id === i.idProduto)
                      ?.idUnidadeMedida,
                )?.sigla || "—"}
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
      <Link href="/vendas">Voltar aos registros</Link>
    </>
  );
}
export function SaleEditor() {
  const lookups = useLookups(),
    client = useQueryClient(),
    router = useRouter();
  const [draft, setDraft] = useState(draftValues);
  const [error, setError] = useState<unknown>(),
    [busy, setBusy] = useState(false);
  const prerequisites = [
    lookups.customers,
    lookups.stores,
    lookups.products,
    lookups.users,
  ].every((q) => q.isSuccess && !!q.data?.length);
  let total: number | undefined,
    roundingDifference = false;
  try {
    const calculated = totals(draft.itens);
    total = calculated.total;
    roundingDifference = calculated.roundingDifference;
  } catch {}
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !prerequisites) return;
    setError(undefined);
    let body;
    try {
      body = salePayload(draft);
    } catch (err) {
      setError({
        status: 400,
        data: {
          message: err instanceof Error ? err.message : "Revise os dados.",
        },
      });
      return;
    }
    setBusy(true);
    try {
      const saved = await criarVenda({ body }).unwrap();
      await refreshCatalog(client);
      router.push(`/vendas/${saved.id}`);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading
        eyebrow="VENDAS"
        title="Nova venda"
        description={inventoryHint}
      />
      <LookupErrors lookups={lookups} />
      <div className="mb-5 flex flex-wrap gap-4">
        <Link href="/clientes">Cadastrar cliente</Link>
        <Link href="/lojas">Cadastrar loja</Link>
        <Link href="/produtos/novo">Cadastrar produto</Link>
      </div>
      {!prerequisites && (
        <p role="status" className="mb-4">
          Para salvar, é necessário carregar e cadastrar pelo menos um cliente,
          uma loja, um produto e um operador existente. Sem operadores, não é
          possível salvar; solicite o cadastro ao responsável pelo ambiente.
        </p>
      )}
      {!!error && <ErrorNotice error={error} />}
      <form onSubmit={submit} noValidate aria-busy={busy}>
        <fieldset disabled={busy} className="space-y-5">
          <Panel className="grid grid-cols-2 gap-5 p-5 mobile:grid-cols-1">
            <label>
              Cliente *
              <Select
                aria-label="Cliente *"
                required
                value={draft.idCliente}
                onChange={(e) =>
                  setDraft({ ...draft, idCliente: e.target.value })
                }
              >
                <option value="">Selecione…</option>
                {lookups.customers.data?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </Select>
            </label>
            <label>
              Loja *
              <Select
                aria-label="Loja *"
                required
                value={draft.idLoja}
                onChange={(e) => setDraft({ ...draft, idLoja: e.target.value })}
              >
                <option value="">Selecione…</option>
                {lookups.stores.data?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nomeFantasia}
                  </option>
                ))}
              </Select>
            </label>
            <label>
              Data da venda
              <Input
                type="datetime-local"
                step="1"
                value={draft.dataVenda}
                onChange={(e) =>
                  setDraft({ ...draft, dataVenda: e.target.value })
                }
              />
              <small>
                Horário de São Paulo. Em branco, usa a data do servidor.
              </small>
            </label>
            <label>
              Operador *
              <Select
                aria-label="Operador *"
                required
                value={draft.idUsuario}
                onChange={(e) =>
                  setDraft({ ...draft, idUsuario: e.target.value })
                }
              >
                <option value="">Selecione…</option>
                {lookups.users.data?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </Select>
              <small>
                A seleção registra a responsabilidade nesta demonstração; não é
                autenticação.
              </small>
            </label>
          </Panel>
          {draft.itens.map((item, index) => {
            function change(key: keyof typeof item, value: string) {
              setDraft({
                ...draft,
                itens: draft.itens.map((i, n) =>
                  n === index ? { ...i, [key]: value } : i,
                ),
              });
            }
            let rowTotal: number | undefined;
            try {
              rowTotal = Number(itemCalculation(item).cents) / 100;
            } catch {}
            return (
              <Panel
                key={index}
                className="grid grid-cols-3 gap-4 p-5 mobile:grid-cols-1"
                aria-label={`Item ${index + 1}`}
              >
                <h2 className="col-span-full font-semibold">
                  Item {index + 1}
                </h2>
                <label>
                  Produto *
                  <Select
                    aria-label="Produto *"
                    required
                    value={item.idProduto}
                    onChange={(e) => change("idProduto", e.target.value)}
                  >
                    <option value="">Selecione…</option>
                    {lookups.products.data?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </Select>
                </label>
                {(["quantidade", "precoUnitario", "desconto"] as const).map(
                  (key) => (
                    <label key={key}>
                      {
                        {
                          quantidade: "Quantidade *",
                          precoUnitario: "Preço unitário (R$) *",
                          desconto: "Desconto (R$)",
                        }[key]
                      }
                      <Input
                        inputMode="decimal"
                        value={item[key]}
                        onChange={(e) => change(key, e.target.value)}
                      />
                      <small>
                        Até {key === "quantidade" ? 3 : 2} casas decimais.
                      </small>
                    </label>
                  ),
                )}
                <p>Prévia do item: {currency(rowTotal)}</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      itens: draft.itens.filter((_, n) => n !== index),
                    })
                  }
                >
                  Remover item {index + 1}
                </Button>
              </Panel>
            );
          })}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setDraft({ ...draft, itens: [...draft.itens, blankItem()] })
            }
          >
            Adicionar item
          </Button>
          {roundingDifference && (
            <p>
              O total arredonda a soma dos valores brutos; pode diferir da soma
              das prévias arredondadas dos itens.
            </p>
          )}
          <p className="text-lg">
            Prévia total: <strong>{currency(total)}</strong>
          </p>
          <div className="flex flex-wrap gap-4">
            <Button type="submit" disabled={busy || !prerequisites}>
              {busy ? "Salvando…" : "Salvar venda aberta"}
            </Button>
            <Button asChild variant="outline">
              <Link href="/vendas">Voltar</Link>
            </Button>
          </div>
        </fieldset>
      </form>
    </>
  );
}
