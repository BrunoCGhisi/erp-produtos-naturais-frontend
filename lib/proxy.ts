const resources = new Set([
  "clientes",
  "vendas",
  "usuarios",
  "fornecedores",
  "compras",
  "recebimentos-compras",
  "estoques",
  "movimentacoes-estoque",
  "produtos",
  "categorias",
  "unidades-medida",
  "lojas",
  "produtos-sku",
  "produtos-loja",
  "produtos-precos-loja",
]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function forwardCatalog(request: Request, path: string[]) {
  const [resource, id] = path;
  const inventory =
    resource === "estoques" || resource === "movimentacoes-estoque";
  const receipt = resource === "recebimentos-compras";
  const conclude = receipt && path.length === 3 && path[2] === "concluir";
  const balance = resource === "estoques" && id === "saldo";
  if (
    !resources.has(resource) ||
    (resource === "usuarios" && path.length !== 1) ||
    (path.length > 2 && !conclude) ||
    (id && !balance && !uuid.test(id))
  )
    return Response.json(
      { message: "Recurso não encontrado." },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  const allowed =
    receipt
      ? conclude ? ["POST"] : id ? ["GET", "PUT", "DELETE"] : ["GET", "POST"]
      : resource === "usuarios"
      ? ["GET"]
      : resource === "vendas"
        ? id
          ? ["GET"]
          : ["GET", "POST"]
        : inventory
          ? ["GET"]
          : id
            ? resource === "produtos-loja"
              ? ["GET", "DELETE"]
              : resource === "compras"
                ? ["GET", "PUT"]
                : ["GET", "PUT", "DELETE"]
            : ["GET", "POST"];
  if (!allowed.includes(request.method))
    return Response.json(
      { message: "Método não permitido." },
      {
        status: 405,
        headers: { Allow: allowed.join(", "), "Cache-Control": "no-store" },
      },
    );
  if (receipt) {
    const params = new URL(request.url).searchParams;
    const valid = [...params.keys()].every(k => k === "idCompra" || k === "versao") &&
      (!params.has("idCompra") || (!id && params.getAll("idCompra").length === 1 && uuid.test(params.get("idCompra") || ""))) &&
      (!params.has("versao") || (request.method === "DELETE" && params.getAll("versao").length === 1 && /^\d+$/.test(params.get("versao") || ""))) &&
      (request.method !== "DELETE" || params.has("versao"));
    if (!valid) return Response.json({ message: "Parâmetros de recebimento inválidos." }, { status: 400 });
    if (request.method === "POST" && !id && !uuid.test(request.headers.get("Idempotency-Key") || ""))
      return Response.json({ message: "Informe Idempotency-Key UUID." }, { status: 400 });
  }
  if (balance) {
    const params = new URL(request.url).searchParams;
    if (
      !["idProduto", "idLoja"].every(
        (key) =>
          params.getAll(key).length === 1 && uuid.test(params.get(key) || ""),
      )
    )
      return Response.json(
        { message: "Informe idProduto e idLoja válidos." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
  }
  try {
    const base = process.env.BACKEND_API_URL || "http://localhost:8080";
    const url = new URL(`/api/${path.join("/")}`, base);
    url.search = new URL(request.url).search;
    const result = await fetch(url, {
      method: request.method,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
      headers: {
        Accept: "application/json",
        ...(receipt && !id && request.method === "POST" ? { "Idempotency-Key": request.headers.get("Idempotency-Key")! } : {}),
        ...(request.method === "POST" || request.method === "PUT"
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body:
        request.method === "POST" || request.method === "PUT"
          ? await request.text()
          : undefined,
    });
    return new Response(
      result.status === 204 || result.status === 304
        ? null
        : await result.arrayBuffer(),
      {
        status: result.status,
        headers: {
          "Content-Type":
            result.headers.get("content-type") || "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return Response.json(
      { message: "Não foi possível conectar ao backend. Tente novamente." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
