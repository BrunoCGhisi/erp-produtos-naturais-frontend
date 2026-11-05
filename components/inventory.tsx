"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useListarEstoques } from "@/generated/sdk/hooks/useListarEstoques";
import { useConsultarSaldoEstoque } from "@/generated/sdk/hooks/useConsultarSaldoEstoque";
import { useListarMovimentacoesEstoque } from "@/generated/sdk/hooks/useListarMovimentacoesEstoque";
import { useListarProdutos } from "@/generated/sdk/hooks/useListarProdutos";
import { useListarLojas } from "@/generated/sdk/hooks/useListarLojas";
import { useListarUnidadesMedida } from "@/generated/sdk/hooks/useListarUnidadesMedida";
import type { MovimentacaoResponseDTO } from "@/generated/sdk/types/MovimentacaoResponseDTO";
import { Heading, Loading, Empty, ErrorNotice } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Table, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { inDateRange, inventoryInstant, inventoryLink, matchesIds, matchesQuantity, movementLabels, quantity, timestamp } from "@/lib/inventory";

export function Inventory({ movements = false }: { movements?: boolean }) {
  const params = useSearchParams(), path = usePathname();
  const product = params.get("idProduto") || "", store = params.get("idLoja") || "";
  const search = params.get("busca") || "", amount = params.get("quantidade") || "";
  const type = params.get("tipo") || "", start = params.get("inicio") || "", end = params.get("fim") || "";
  const sort = params.get("ordem") || (movements ? "data-desc" : "nome-asc");
  const filter = { idProduto: product || undefined, idLoja: store || undefined };
  const stocks = useListarEstoques({ query: filter }, { query: { enabled: !movements } });
  const history = useListarMovimentacoesEstoque({ query: filter }, { query: { enabled: movements } });
  const balance = useConsultarSaldoEstoque({ query: { idProduto: product, idLoja: store } }, { query: { enabled: !movements && !!product && !!store } });
  const products = useListarProdutos(), stores = useListarLojas(), units = useListarUnidadesMedida();
  const [detail, setDetail] = useState<MovimentacaoResponseDTO>();
  function control(key: string, value: string) {
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== "pagina") next.delete("pagina");
    window.history.replaceState(null, "", `${path}?${next}`);
  }
  function productName(id?: string, fallback?: string) { return products.data?.find((x) => x.id === id)?.nome || fallback || id || "—"; }
  function storeName(id?: string, fallback?: string) { return stores.data?.find((x) => x.id === id)?.nomeFantasia || fallback || id || "—"; }
  function unit(id?: string) {
    const p = products.data?.find((x) => x.id === id);
    return units.data?.find((x) => x.id === p?.idUnidadeMedida)?.sigla || p?.siglaUnidadeMedida || p?.idUnidadeMedida || "—";
  }
  const stockRows = (stocks.data || []).filter((x) => matchesIds(x, product, store) && productName(x.idProduto, x.nomeProduto).toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")) && matchesQuantity(x.quantidadeAtual, amount));
  const movementRows = (history.data || []).filter((x) => matchesIds(x, product, store) && (!type || x.tipo === type) && inDateRange(x.dataMovimentacao, start, end));
  const rows = (movements ? movementRows : stockRows).map((x) => ({
    ...x,
    name: productName(x.idProduto, "nomeProduto" in x ? x.nomeProduto : undefined),
    storeName: storeName(x.idLoja, "nomeLoja" in x ? x.nomeLoja : undefined),
    date: "dataMovimentacao" in x ? x.dataMovimentacao : "atualizadoEm" in x ? x.atualizadoEm : undefined,
    amount: "quantidadeAtual" in x ? x.quantidadeAtual : "quantidade" in x ? x.quantidade : undefined,
  })).sort((a, b) => {
    const direction = sort.endsWith("desc") ? -1 : 1;
    const value = sort.startsWith("data") ? (a.date ? inventoryInstant(a.date).getTime() : 0) - (b.date ? inventoryInstant(b.date).getTime() : 0) : sort.startsWith("quantidade") ? (a.amount ?? 0) - (b.amount ?? 0) : a.name.localeCompare(b.name, "pt-BR");
    return value * direction || (a.id || "").localeCompare(b.id || "");
  });
  const pages = Math.max(1, Math.ceil(rows.length / 20));
  const page = Math.min(pages, Math.max(1, Math.trunc(Number(params.get("pagina"))) || 1));
  const current = movements ? history : stocks;
  const invalidRange = !!start && !!end && start > end;
  return <>
    <Heading eyebrow="ESTOQUE" title={movements ? "Movimentações" : "Saldos de estoque"} description={movements ? "Consulte o histórico por produto e loja. Horários de São Paulo." : "Acompanhe as quantidades disponíveis por produto e loja."} action={<Button variant="outline" disabled={current.isFetching || (!movements && balance.isFetching)} onClick={() => { void current.refetch(); if (!movements && product && store) void balance.refetch(); }}>Atualizar</Button>} />
    <div className="mb-5 flex flex-wrap justify-between gap-3 text-[12px] text-muted">
      <Link className="text-primary hover:underline" href={inventoryLink(movements ? "/estoque" : "/estoque/movimentacoes", product, store)}>{movements ? "Consultar saldos" : "Ver movimentações"}</Link>
      <span role="status">{current.dataUpdatedAt ? `Última atualização bem-sucedida: ${timestamp(new Date(current.dataUpdatedAt).toISOString())}` : "Aguardando primeira consulta"}{current.isFetching ? " · Atualizando…" : ""}</span>
    </div>
    {[products, stores, units].map((q, i) => q.isError && <div key={i} className="mb-3"><p className="text-sm text-muted">Não foi possível carregar {['produtos', 'lojas', 'unidades de medida'][i]}. Os registros continuam disponíveis pelos IDs.</p><ErrorNotice error={q.error} retry={() => void q.refetch()} /></div>)}
    <Panel as="section" aria-label={movements ? "Histórico de estoque" : "Saldos por produto e loja"}>
      <div className="grid grid-cols-3 gap-3 border-b border-border p-5 compact:grid-cols-2 mobile:grid-cols-1">
        <label className="text-xs">Produto<Select aria-label="Produto" value={product} onChange={(e) => control("idProduto", e.target.value)}><option value="">Todos os produtos</option>{product && !products.data?.some((x) => x.id === product) && <option value={product}>{product}</option>}{products.data?.map((x) => <option key={x.id} value={x.id}>{x.nome || x.id}</option>)}</Select></label>
        <label className="text-xs">Loja<Select aria-label="Loja" value={store} onChange={(e) => control("idLoja", e.target.value)}><option value="">Todas as lojas</option>{store && !stores.data?.some((x) => x.id === store) && <option value={store}>{store}</option>}{stores.data?.map((x) => <option key={x.id} value={x.id}>{x.nomeFantasia || x.id}</option>)}</Select></label>
        {movements ? <>
          <label className="text-xs">Tipo de movimentação<Select aria-label="Tipo de movimentação" value={type} onChange={(e) => control("tipo", e.target.value)}><option value="">Todos os tipos</option>{Object.entries(movementLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></label>
          <label className="text-xs">Data inicial<Input type="date" value={start} onChange={(e) => control("inicio", e.target.value)} /></label>
          <label className="text-xs">Data final<Input type="date" value={end} min={start} onChange={(e) => control("fim", e.target.value)} /></label>
        </> : <>
          <label className="text-xs">Buscar por nome<Input value={search} placeholder="Nome do produto…" onChange={(e) => control("busca", e.target.value)} /></label>
          <label className="text-xs">Quantidade<Select aria-label="Quantidade" value={amount} onChange={(e) => control("quantidade", e.target.value)}><option value="">Todos</option><option value="positivo">Positivo</option><option value="zero">Zero</option><option value="negativo">Negativo</option></Select></label>
        </>}
        <label className="text-xs">Ordenar<Select aria-label="Ordenar" value={sort} onChange={(e) => control("ordem", e.target.value)}><option value="nome-asc">Produto: A–Z</option><option value="nome-desc">Produto: Z–A</option><option value="data-desc">Mais recentes</option><option value="data-asc">Mais antigos</option><option value="quantidade-asc">Quantidade crescente</option><option value="quantidade-desc">Quantidade decrescente</option></Select></label>
      </div>
      {invalidRange && <p role="alert" className="p-5 text-sm text-red-700">A data final deve ser igual ou posterior à inicial.</p>}
      {!movements && product && store && <div className="border-b border-border bg-[#f0f5ed] p-5" aria-label="Saldo exato">
        <p className="mb-2 text-sm font-semibold">Saldo exato do produto nesta loja</p>
        {balance.isError && <ErrorNotice error={balance.error} retry={() => void balance.refetch()} />}
        {balance.isPending ? <Loading /> : balance.data && <p className="text-xl">{quantity(balance.data.quantidadeAtual)} <span className="text-sm">{unit(product)}</span></p>}
        {stocks.data && !stocks.data.some((x) => matchesIds(x, product, store)) && <p className="mt-2 text-xs">Sem registro de estoque</p>}
      </div>}
      {current.isError && <div className="p-5"><ErrorNotice error={current.error} retry={() => void current.refetch()} /></div>}
      {current.isPending ? <Loading /> : current.data && (rows.length === 0 ? <Empty title={movements ? "Nenhuma movimentação encontrada" : "Nenhum registro de estoque encontrado"} description="Ajuste os filtros ou atualize a consulta." /> : <Table>
        <thead><TableRow>{(movements ? ["DATA / HORA", "PRODUTO", "LOJA", "TIPO", "QUANTIDADE", "OBSERVAÇÃO", "DETALHES"] : ["PRODUTO", "LOJA", "UNIDADE", "QUANTIDADE ATUAL", "ÚLTIMA ATUALIZAÇÃO", "AÇÕES"]).map((title) => <TableHead key={title}>{title}</TableHead>)}</TableRow></thead>
        <tbody>{rows.slice((page - 1) * 20, page * 20).map((row, i) => <TableRow key={row.id || i}>
          {movements && <TableCell>{timestamp(row.date)}</TableCell>}
          <TableCell>{row.idProduto ? <Link className="font-semibold text-primary hover:underline" href={`/produtos/${row.idProduto}`}>{row.name}</Link> : row.name}</TableCell><TableCell>{row.storeName}</TableCell>
          {movements ? <TableCell>{movementLabels[(row as MovimentacaoResponseDTO).tipo!] || (row as MovimentacaoResponseDTO).tipo || "—"}</TableCell> : <TableCell>{unit(row.idProduto)}</TableCell>}
          <TableCell>{quantity(row.amount)}{movements ? ` ${unit(row.idProduto)}` : ""}</TableCell>
          {movements ? <><TableCell><p className="max-w-60 truncate">{(row as MovimentacaoResponseDTO).observacao || "—"}</p></TableCell><TableCell><Button variant="ghost" size="sm" onClick={() => setDetail(row as MovimentacaoResponseDTO)}>Ver detalhes</Button></TableCell></> : <><TableCell>{timestamp(row.date)}</TableCell><TableCell><Link className="text-primary hover:underline" href={inventoryLink("/estoque/movimentacoes", row.idProduto, row.idLoja)}>Ver movimentações</Link></TableCell></>}
        </TableRow>)}</tbody>
      </Table>)}
      {current.data && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 text-xs"><span>{rows.length} registros · Página {page} de {pages}</span><div className="flex gap-3"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => control("pagina", String(page - 1))}>Anterior</Button><Button size="sm" variant="outline" disabled={page >= pages} onClick={() => control("pagina", String(page + 1))}>Próxima</Button></div></div>}
    </Panel>
    <Dialog open={!!detail} onOpenChange={(open) => { if (!open) setDetail(undefined); }}><DialogContent><DialogTitle>Detalhes da movimentação</DialogTitle><DialogDescription>Consulta somente leitura · America/Sao_Paulo</DialogDescription>{detail && <dl className="space-y-3 break-words text-sm">
      {[["Movimentação", detail.id], ["Data / hora", timestamp(detail.dataMovimentacao)], ["Produto", productName(detail.idProduto)], ["Loja", storeName(detail.idLoja)], ["Tipo", detail.tipo && movementLabels[detail.tipo]], ["Quantidade", `${quantity(detail.quantidade)} ${unit(detail.idProduto)}`], ["Observação", detail.observacao || "Sem observação"], ["Usuário", detail.idUsuario], ["Venda", detail.idVenda], ["Compra", detail.idCompra], ["Transferência", detail.idTransferencia], ["Ajuste de estoque", detail.idAjusteEstoque]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="text-xs text-muted">{label}</dt><dd className="whitespace-pre-wrap">{value}</dd></div>)}
    </dl>}</DialogContent></Dialog>
  </>;
}
