// @vitest-environment jsdom
import "./setup";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import { PurchaseEditor, PurchaseRecord } from "@/components/purchases";
const state = vi.hoisted(() => ({
  recordError: false,
  push: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  fetch: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: state.push }) }));
vi.mock("@/generated/sdk/hooks/useBuscarCompraPorId", () => ({
  useBuscarCompraPorId: () => ({
    data: initial,
    isPending: false,
    isError: state.recordError,
    error: { status: 502 },
    refetch: vi.fn(),
  }),
}));
const id = "11111111-1111-4111-8111-111111111111";
const result = () => ({
  data: [{ id, nome: "Aveia", nomeFantasia: "Natural" }],
  isSuccess: true,
  isError: false,
});
vi.mock("@/generated/sdk/hooks/useListarFornecedores", () => ({
  useListarFornecedores: () => result(),
}));
vi.mock("@/generated/sdk/hooks/useListarLojas", () => ({
  useListarLojas: () => result(),
}));
vi.mock("@/generated/sdk/hooks/useListarProdutos", () => ({
  useListarProdutos: () => result(),
}));
vi.mock("@/generated/sdk/clients/criarCompra", () => ({
  criarCompra: (...args: unknown[]) => ({
    unwrap: () => state.create(...args),
  }),
}));
vi.mock("@/generated/sdk/clients/atualizarCompra", () => ({
  atualizarCompra: (...args: unknown[]) => ({
    unwrap: () => state.update(...args),
  }),
}));
vi.mock("@/generated/sdk/clients/buscarCompraPorId", () => ({
  buscarCompraPorId: () => ({ unwrap: () => state.fetch() }),
}));
const initial = {
  id,
  idFornecedor: id,
  idLoja: id,
  idUsuario: id,
  status: "RASCUNHO" as const,
  itens: [
    {
      id,
      idProduto: id,
      quantidade: 1.125,
      custoUnitario: 2.3456,
      desconto: 0.1,
    },
  ],
  observacao: "Manter observação",
};
function renderEditor() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <PurchaseEditor initial={initial} />
    </QueryClientProvider>,
  );
  return client;
}
beforeEach(() => {
  vi.clearAllMocks();
  state.recordError = false;
});
it("mostra validação de desconto antes do envio e mantém os campos para correção", async () => {
  renderEditor();
  fireEvent.change(screen.getByLabelText(/Desconto/), {
    target: { value: "100" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Salvar rascunho" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "O desconto não pode superar",
  );
  expect(state.update).not.toHaveBeenCalled();
  expect(screen.getByLabelText(/Quantidade/)).toHaveValue("1,125");
  expect(screen.getByLabelText(/Desconto/)).toHaveValue("100");
});
it("erro de servidor mantém edição e recarrega status concorrente bloqueando novo envio", async () => {
  state.update.mockRejectedValue({
    status: 400,
    data: { message: "Somente compras em rascunho podem ser alteradas" },
  });
  state.fetch.mockResolvedValue({ ...initial, status: "RECEBIDA" });
  renderEditor();
  fireEvent.change(screen.getByLabelText("Observação"), {
    target: { value: "Texto não salvo" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Salvar rascunho" }));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Salvar rascunho" }),
    ).toBeDisabled(),
  );
  expect(screen.getByText(/Status salvo: Recebida/)).toBeVisible();
  expect(screen.getByLabelText("Observação")).toHaveValue("Texto não salvo");
  expect(state.update).toHaveBeenCalledTimes(1);
  expect(state.push).not.toHaveBeenCalled();
});
it("PUT completo invalida listas e detalhe antes de navegar ao total salvo", async () => {
  state.update.mockResolvedValue({ ...initial, valorTotal: 2.54 });
  const client = renderEditor(),
    invalidate = vi.spyOn(client, "invalidateQueries");
  fireEvent.click(screen.getByRole("button", { name: "Salvar rascunho" }));
  await waitFor(() =>
    expect(state.push).toHaveBeenCalledWith(`/compras/${id}`),
  );
  expect(invalidate).toHaveBeenCalledTimes(1);
  expect(state.update.mock.calls[0][0]).toMatchObject({
    path: { id },
    body: {
      idUsuario: id,
      status: "RASCUNHO",
      itens: [{ id, quantidade: 1.125, custoUnitario: 2.3456, desconto: 0.1 }],
    },
  });
});
it("bloqueia reenvio após restrição de status mesmo se a consulta de confirmação falha", async () => {
  state.update.mockRejectedValue({
    status: 400,
    data: { message: "Somente compras em rascunho podem ser alteradas" },
  });
  state.fetch.mockRejectedValue({ status: 502 });
  renderEditor();
  fireEvent.click(screen.getByRole("button", { name: "Salvar rascunho" }));
  expect(
    await screen.findByText("Não foi possível consultar o status salvo."),
  ).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Salvar rascunho" }),
  ).toBeDisabled();
  state.fetch.mockResolvedValue({ ...initial, status: "RECEBIDA" });
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(await screen.findByText(/Status salvo: Recebida/)).toBeVisible();
  expect(state.update).toHaveBeenCalledTimes(1);
});

it("bloqueia edição se a query recebe um status novo sem descartar valores locais", () => {
  const client = new QueryClient();
  const view = render(
    <QueryClientProvider client={client}>
      <PurchaseEditor initial={initial} />
    </QueryClientProvider>,
  );
  fireEvent.change(screen.getByLabelText("Observação"), {
    target: { value: "Não salvo" },
  });
  view.rerender(
    <QueryClientProvider client={client}>
      <PurchaseEditor initial={{ ...initial, status: "CANCELADA" }} />
    </QueryClientProvider>,
  );
  expect(
    screen.getByRole("button", { name: "Salvar rascunho" }),
  ).toBeDisabled();
  expect(screen.getByLabelText("Observação")).toHaveValue("Não salvo");
  expect(screen.getByText(/Status salvo: Cancelada/)).toBeVisible();
});

it("falha de atualização do detalhe preserva o editor e seus valores", () => {
  const client = new QueryClient();
  const view = render(
    <QueryClientProvider client={client}>
      <PurchaseRecord id={id} edit />
    </QueryClientProvider>,
  );
  fireEvent.change(screen.getByLabelText("Observação"), {
    target: { value: "Rascunho local" },
  });
  state.recordError = true;
  view.rerender(
    <QueryClientProvider client={client}>
      <PurchaseRecord id={id} edit />
    </QueryClientProvider>,
  );
  expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível");
  expect(screen.getByLabelText("Observação")).toHaveValue("Rascunho local");
});
