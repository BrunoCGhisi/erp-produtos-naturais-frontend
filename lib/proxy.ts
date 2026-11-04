const resources = new Set([
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
  if (!resources.has(resource) || path.length > 2 || (id && !uuid.test(id)))
    return Response.json(
      { message: "Recurso não encontrado." },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  const allowed = id
    ? resource === "produtos-loja"
      ? ["GET", "DELETE"]
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
