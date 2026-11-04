"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useListarCategorias } from "@/generated/sdk/hooks/useListarCategorias";
import { useListarUnidadesMedida } from "@/generated/sdk/hooks/useListarUnidadesMedida";
import { useBuscarProdutoPorId } from "@/generated/sdk/hooks/useBuscarProdutoPorId";
import { Heading, Loading, ErrorNotice } from "@/components/feedback";
import { RecordForm } from "@/components/record-form";
export function ProductEditor({ id }: { id?: string }) {
  const router = useRouter();
  const categories = useListarCategorias(),
    units = useListarUnidadesMedida();
  const product = useBuscarProdutoPorId(
    { path: { id: id || "" } },
    { query: { enabled: !!id } },
  );
  const loading =
    categories.isPending || units.isPending || (!!id && product.isPending);
  const hasPrerequisites = !!categories.data?.length && !!units.data?.length;
  return (
    <>
      <Link className="back-link" href={id ? `/produtos/${id}` : "/produtos"}>
        <ArrowLeft size={15} />
        Voltar {id ? "ao produto" : "aos produtos"}
      </Link>
      <Heading
        title={id ? "Editar produto" : "Novo produto"}
        description="Cadastre as informações básicas. SKUs, lojas e preços são salvos depois."
      />
      {loading ? (
        <Loading />
      ) : categories.isError || units.isError || (id && product.isError) ? (
        <>
          {categories.isError && (
            <ErrorNotice
              error={categories.error}
              retry={() => void categories.refetch()}
            />
          )}{" "}
          {units.isError && (
            <ErrorNotice
              error={units.error}
              retry={() => void units.refetch()}
            />
          )}{" "}
          {id && product.isError && (
            <ErrorNotice
              error={product.error}
              retry={() => void product.refetch()}
            />
          )}
        </>
      ) : (
        <>
          {!hasPrerequisites && (
            <div className="notice notice-info">
              <p>
                Antes de cadastrar produtos, crie pelo menos uma{" "}
                <Link className="underline" href="/categorias">
                  categoria
                </Link>{" "}
                e uma{" "}
                <Link className="underline" href="/unidades-medida">
                  unidade de medida
                </Link>
                .
              </p>
            </div>
          )}
          <div className="panel form-panel">
            <div className="panel-header">
              <div>
                <h2>Informações do produto</h2>
                <p>Campos com * são obrigatórios.</p>
              </div>
            </div>
            <RecordForm
              resource="products"
              initial={id ? product.data : undefined}
              disabled={!hasPrerequisites}
              fieldOptions={{
                idCategoria: categories.data?.map((x) => ({
                  value: x.id!,
                  label: x.nome || "",
                })),
                idUnidadeMedida: units.data?.map((x) => ({
                  value: x.id!,
                  label: `${x.nome} (${x.sigla})`,
                })),
              }}
              onCancel={() => router.push(id ? `/produtos/${id}` : "/produtos")}
              onSaved={(row) => {
                const saved = row as { id?: string };
                router.push(`/produtos/${saved.id || id}`);
              }}
            />
          </div>
          <p className="subtle mt-5">
            Salve o produto para habilitar o cadastro de SKUs, vínculos com
            lojas e preços.
          </p>
        </>
      )}
    </>
  );
}
