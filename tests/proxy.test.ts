// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { forwardCatalog } from "@/lib/proxy";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("mantém filtros, status e mensagem JSON sem cache", async () => {
  vi.stubEnv("BACKEND_API_URL", "http://localhost:9090");
  const fetch = vi
    .fn()
    .mockResolvedValue(
      Response.json({ message: "Duplicado" }, { status: 409 }),
    );
  vi.stubGlobal("fetch", fetch);
  const result = await forwardCatalog(
    new Request("http://localhost/api/produtos?idProduto=abc"),
    ["produtos"],
  );
  expect(String(fetch.mock.calls[0][0])).toBe(
    "http://localhost:9090/api/produtos?idProduto=abc",
  );
  expect(fetch.mock.calls[0][1].cache).toBe("no-store");
  expect(result.status).toBe(409);
  expect(await result.json()).toEqual({ message: "Duplicado" });
});
it("preserva resposta vazia 204", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
  );
  const result = await forwardCatalog(
    new Request(
      "http://localhost/api/produtos/11111111-1111-4111-8111-111111111111",
      { method: "DELETE" },
    ),
    ["produtos", "11111111-1111-4111-8111-111111111111"],
  );
  expect(result.status).toBe(204);
  expect(await result.text()).toBe("");
});
it.each([
  ["usuarios"],
  ["produtos", ".."],
  ["produtos", "11111111-1111-4111-8111-111111111111", "extra"],
])("bloqueia caminhos fora do catálogo: %s", async (...path) => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  expect(
    (await forwardCatalog(new Request("http://localhost/api/usuarios"), path))
      .status,
  ).toBe(404);
  expect(fetch).not.toHaveBeenCalled();
});
it("não permite PUT de vínculo", async () =>
  expect(
    (
      await forwardCatalog(
        new Request("http://localhost/api/produtos-loja/id", { method: "PUT" }),
        ["produtos-loja", "11111111-1111-4111-8111-111111111111"],
      )
    ).status,
  ).toBe(405));
it("retorna erro tratável quando backend está indisponível", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  expect(
    (
      await forwardCatalog(new Request("http://localhost/api/produtos"), [
        "produtos",
      ])
    ).status,
  ).toBe(502);
});
const inventoryId = "11111111-1111-4111-8111-111111111111";
it.each([
  ["estoques"], ["estoques", inventoryId], ["estoques", "saldo"],
  ["movimentacoes-estoque"], ["movimentacoes-estoque", inventoryId],
])("encaminha GET de estoque %s", async (...path) => {
  const fetch = vi.fn().mockResolvedValue(Response.json({ ok: true }));
  vi.stubGlobal("fetch", fetch);
  const query = `?idProduto=${inventoryId}&idLoja=${inventoryId}`;
  const result = await forwardCatalog(new Request(`http://localhost/api/${path.join("/")}${query}`), path);
  expect(result.status).toBe(200);
  expect(String(fetch.mock.calls[0][0])).toBe(`http://localhost:8080/api/${path.join("/")}${query}`);
});
it.each(["", "?idProduto=abc&idLoja=abc", `?idProduto=${inventoryId}`, `?idLoja=${inventoryId}`, `?idProduto=${inventoryId}&idLoja=${inventoryId}&idLoja=${inventoryId}`])("exige parâmetros válidos no saldo %s", async (query) => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  expect((await forwardCatalog(new Request(`http://localhost/api/estoques/saldo${query}`), ["estoques", "saldo"])).status).toBe(400);
  expect(fetch).not.toHaveBeenCalled();
});
it.each(["estoques", "movimentacoes-estoque"])("valida UUID e bloqueia toda escrita em %s", async (resource) => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  for (const id of ["invalid", "..", "saldo"]) {
    if (resource === "estoques" && id === "saldo") continue;
    expect((await forwardCatalog(new Request("http://localhost/api"), [resource, id])).status).toBe(404);
  }
  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
    for (const path of [[resource], [resource, inventoryId], ...(resource === "estoques" ? [[resource, "saldo"]] : [])]) {
      const result = await forwardCatalog(new Request("http://localhost/api", { method }), path);
      expect(result.status).toBe(405); expect(result.headers.get("Allow")).toBe("GET");
    }
  }
  expect(fetch).not.toHaveBeenCalled();
});
