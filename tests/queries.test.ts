import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";
import { refreshCatalog } from "@/lib/queries";
it("reconsulta listas, detalhe e relacionamentos ativos após uma mutação", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  const list = vi.fn().mockResolvedValue([{ nome: "Anterior" }]);
  const detail = vi.fn().mockResolvedValue({ nome: "Anterior" });
  const relations = vi.fn().mockResolvedValue([]);
  const observers = [
    new QueryObserver(client, {
      queryKey: [{ url: "/api/produtos" }],
      queryFn: list,
    }),
    new QueryObserver(client, {
      queryKey: [{ url: "/api/produtos/:id", params: { id: "1" } }],
      queryFn: detail,
    }),
    new QueryObserver(client, {
      queryKey: [{ url: "/api/produtos-sku" }, { idProduto: "1" }],
      queryFn: relations,
    }),
  ];
  const subscriptions = observers.map((o) => o.subscribe(() => {}));
  await Promise.all(observers.map((o) => o.refetch()));
  list.mockResolvedValue([{ nome: "Atualizado" }]);
  detail.mockResolvedValue({ nome: "Atualizado" });
  await refreshCatalog(client);
  expect(list).toHaveBeenCalledTimes(2);
  expect(detail).toHaveBeenCalledTimes(2);
  expect(relations).toHaveBeenCalledTimes(2);
  expect(observers[0].getCurrentResult().data).toEqual([
    { nome: "Atualizado" },
  ]);
  subscriptions.forEach((stop) => stop());
  client.clear();
});
