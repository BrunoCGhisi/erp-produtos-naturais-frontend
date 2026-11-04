"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Pencil,
  Barcode,
  Store,
  Tags,
  Plus,
  Trash2,
} from "lucide-react";
import { useBuscarProdutoPorId } from "@/generated/sdk/hooks/useBuscarProdutoPorId";
import { useListarProdutosSku } from "@/generated/sdk/hooks/useListarProdutosSku";
import { useListarProdutosLoja } from "@/generated/sdk/hooks/useListarProdutosLoja";
import { useListarPrecosProdutoLoja } from "@/generated/sdk/hooks/useListarPrecosProdutoLoja";
import { useListarLojas } from "@/generated/sdk/hooks/useListarLojas";
import {
  Heading,
  Loading,
  ErrorNotice,
  Empty,
  Status,
} from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RecordModal } from "@/components/record-form";
import { DeleteDialog } from "@/components/delete-dialog";
import { currency, dateLabel, localDate } from "@/lib/validation";
import type { Resource } from "@/lib/catalog";
type Relationship = "skus" | "assignments" | "prices";
type RelationRow = {
  id?: string;
  idProduto?: string;
  idLoja?: string;
  sku?: string;
  status?: string;
  ean13?: string;
  dun14?: string;
  descricaoApresentacao?: string;
  nomeLoja?: string;
  preco?: number;
  dataInicio?: string;
  dataFim?: string;
};
function Relationships({
  id,
  resource,
  storeId,
}: {
  id: string;
  resource: Relationship;
  storeId: string;
}) {
  const skus = useListarProdutosSku(
    { query: { idProduto: id } },
    { query: { enabled: resource === "skus" } },
  );
  const assignments = useListarProdutosLoja(
    { query: { idProduto: id, ...(storeId ? { idLoja: storeId } : {}) } },
    { query: { enabled: resource === "assignments" } },
  );
  const prices = useListarPrecosProdutoLoja(
    { query: { idProduto: id, ...(storeId ? { idLoja: storeId } : {}) } },
    { query: { enabled: resource === "prices" } },
  );
  const stores = useListarLojas();
  const query =
    resource === "skus"
      ? skus
      : resource === "assignments"
        ? assignments
        : prices;
  const [edit, setEdit] = useState<RelationRow | null | undefined>(),
    [remove, setRemove] = useState<RelationRow>(),
    [success, setSuccess] = useState("");
  const rows = (query.data || []).filter(
    (row: RelationRow) =>
      row.idProduto === id &&
      (resource === "skus" || !storeId || row.idLoja === storeId),
  );
  const labels = {
    skus: {
      title: "SKUs do produto",
      new: "Novo SKU",
      description:
        "Identificadores e apresentações deste produto, válidos para todas as lojas.",
    },
    assignments: {
      title: "Lojas vinculadas",
      new: "Vincular loja",
      description: "Defina em quais lojas este produto estará disponível.",
    },
    prices: {
      title: "Preços por loja",
      new: "Novo preço",
      description:
        "Todos os registros de preço e suas validades. Períodos podem se sobrepor.",
    },
  }[resource];
  const storeOptions = stores.data?.map((x) => ({
    value: x.id!,
    label: x.nomeFantasia || x.razaoSocial || "",
  }));
  const storeName = (row: RelationRow) =>
    stores.data?.find((x) => x.id === row.idLoja)?.nomeFantasia ||
    row.nomeLoja ||
    row.idLoja;
  const cannotAdd =
    resource !== "skus" && (!stores.data?.length || stores.isError);
  return (
    <>
      {success && (
        <p role="status" className="success">
          {success}
        </p>
      )}
      {stores.isError && (
        <ErrorNotice error={stores.error} retry={() => void stores.refetch()} />
      )}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>{labels.title}</h2>
            <p>{labels.description}</p>
          </div>
          <Button
            disabled={cannotAdd}
            onClick={() => {
              setSuccess("");
              setEdit(null);
            }}
          >
            <Plus size={15} />
            {labels.new}
          </Button>
        </div>
        {resource !== "skus" && stores.isSuccess && !stores.data.length && (
          <div className="notice notice-info m-5">
            <p>
              Cadastre uma{" "}
              <Link href="/lojas" className="underline">
                loja
              </Link>{" "}
              antes de criar vínculos ou preços.
            </p>
          </div>
        )}
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
            title={
              resource === "skus"
                ? "Nenhum SKU cadastrado"
                : resource === "assignments"
                  ? "Nenhuma loja vinculada"
                  : "Nenhum preço cadastrado"
            }
            description="Adicione um registro para continuar. Cada operação é salva separadamente."
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {resource === "skus" ? (
                    <>
                      <th>SKU</th>
                      <th>APRESENTAÇÃO</th>
                      <th>EAN-13 / DUN-14</th>
                      <th>STATUS</th>
                    </>
                  ) : resource === "assignments" ? (
                    <th>LOJA</th>
                  ) : (
                    <>
                      <th>LOJA</th>
                      <th>PREÇO</th>
                      <th>INÍCIO DA VALIDADE</th>
                      <th>FIM DA VALIDADE</th>
                    </>
                  )}
                  <th className="text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: RelationRow) => (
                  <tr key={row.id}>
                    {resource === "skus" ? (
                      <>
                        <td className="row-title">{row.sku}</td>
                        <td>{row.descricaoApresentacao || "—"}</td>
                        <td>
                          {row.ean13 || "—"}
                          <br />
                          {row.dun14 || "—"}
                        </td>
                        <td>
                          <Status value={row.status} />
                        </td>
                      </>
                    ) : resource === "assignments" ? (
                      <td className="row-title">{storeName(row)}</td>
                    ) : (
                      <>
                        <td className="row-title">{storeName(row)}</td>
                        <td>{currency(row.preco)}</td>
                        <td>{dateLabel(row.dataInicio)}</td>
                        <td>{dateLabel(row.dataFim)}</td>
                      </>
                    )}
                    <td>
                      <div className="actions">
                        {resource !== "assignments" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Editar ${resource === "skus" ? row.sku : "preço"}`}
                            onClick={() => setEdit(row)}
                          >
                            <Pencil size={15} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={
                            resource === "assignments"
                              ? `Desvincular ${storeName(row)}`
                              : resource === "skus"
                                ? `Excluir ${row.sku}`
                                : "Excluir preço"
                          }
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
      </section>
      {edit !== undefined && (
        <RecordModal
          key={`${resource}-${edit?.id || "new"}`}
          resource={resource}
          title={
            edit
              ? resource === "skus"
                ? "Editar SKU"
                : "Editar preço"
              : labels.new
          }
          initial={
            edit
              ? {
                  ...edit,
                  ...(resource === "prices"
                    ? {
                        preco: edit.preco?.toFixed(2).replace(".", ","),
                        dataInicio: localDate(edit.dataInicio),
                        dataFim: localDate(edit.dataFim),
                      }
                    : {}),
                }
              : storeId
                ? { idLoja: storeId }
                : undefined
          }
          extra={{ idProduto: id }}
          fieldOptions={{ idLoja: storeOptions }}
          onClose={() => setEdit(undefined)}
          onSaved={() => {
            setEdit(undefined);
            setSuccess("Registro salvo com sucesso.");
          }}
        />
      )}
      {remove?.id && (
        <DeleteDialog
          resource={resource as Resource}
          id={remove.id}
          name={remove.sku || storeName(remove) || "preço"}
          onClose={() => setRemove(undefined)}
          onDeleted={() => {
            setRemove(undefined);
            setSuccess(
              resource === "assignments"
                ? "Loja desvinculada."
                : "Registro excluído.",
            );
          }}
        />
      )}
    </>
  );
}
export function ProductDetail({ id }: { id: string }) {
  const query = useBuscarProdutoPorId({ path: { id } });
  const stores = useListarLojas();
  const [storeId, setStoreId] = useState(""),
    [tab, setTab] = useState("skus");
  if (query.isPending) return <Loading />;
  if (query.isError)
    return (
      <ErrorNotice error={query.error} retry={() => void query.refetch()} />
    );
  const product = query.data;
  return (
    <>
      <Link className="back-link" href="/produtos">
        <ArrowLeft size={15} />
        Voltar aos produtos
      </Link>
      <Heading
        title={product.nome || "Produto"}
        description="Gerencie os identificadores, as lojas e os preços deste produto."
        action={
          <Button asChild variant="outline">
            <Link href={`/produtos/${id}/editar`}>
              <Pencil size={16} />
              Editar produto
            </Link>
          </Button>
        }
      />
      <div className="panel">
        <div className="panel-header">
          <h2>Informações do produto</h2>
          <Status value={product.status} />
        </div>
        <dl className="detail-summary">
          <div>
            <dt>Categoria</dt>
            <dd>{product.nomeCategoria || "—"}</dd>
          </div>
          <div>
            <dt>Unidade de medida</dt>
            <dd>{product.siglaUnidadeMedida || "—"}</dd>
          </div>
          <div>
            <dt>Tipo de venda</dt>
            <dd>{product.tipoVenda === "PESO" ? "Peso" : "Unidade"}</dd>
          </div>
          <div>
            <dt>Identificador</dt>
            <dd className="break-all">{product.id}</dd>
          </div>
        </dl>
        {product.descricao && (
          <p className="detail-description">{product.descricao}</p>
        )}
      </div>
      <Tabs className="tabs" value={tab} onValueChange={setTab}>
        <TabsList className="tabs-list" aria-label="Dados do produto">
          <TabsTrigger value="skus">
            <Barcode size={16} />
            SKUs
          </TabsTrigger>
          <TabsTrigger value="assignments">
            <Store size={16} />
            Lojas
          </TabsTrigger>
          <TabsTrigger value="prices">
            <Tags size={16} />
            Preços
          </TabsTrigger>
        </TabsList>
        {tab !== "skus" && (
          <div className="relationship-filter field">
            <label htmlFor="store-filter">Filtrar por loja</label>
            <select
              id="store-filter"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
            >
              <option value="">Todas as lojas</option>
              {stores.data?.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.nomeFantasia}
                </option>
              ))}
            </select>
          </div>
        )}
        {(["skus", "assignments", "prices"] as const).map((resource) => (
          <TabsContent key={resource} value={resource}>
            <Relationships id={id} resource={resource} storeId={storeId} />
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
