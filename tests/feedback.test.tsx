// @vitest-environment jsdom
import "./setup";
import { render, screen, fireEvent } from "@testing-library/react";
import { it, expect, vi } from "vitest";
import { ErrorNotice } from "@/components/feedback";
import { errorMessage } from "@/lib/errors";
it.each([400, 404, 409, 422])(
  "apresenta o erro de integridade/validação HTTP %s e permite nova tentativa",
  (status) => {
    const retry = vi.fn();
    render(
      <ErrorNotice
        error={{
          status,
          data: {
            message: "Registro referenciado.",
            errors: { nome: "Já cadastrado." },
          },
        }}
        retry={retry}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Registro referenciado.",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("nome: Já cadastrado.");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(retry).toHaveBeenCalledOnce();
  },
);
it("não expõe detalhes de erros inesperados", () =>
  expect(
    errorMessage({ status: 500, data: { message: "SQL secreto" } }),
  ).not.toContain("SQL secreto"));

it("renderiza os detalhes do ApiError real do backend", () => {
  render(
    <ErrorNotice
      error={{
        status: 422,
        data: {
          message: "Dados inválidos.",
          detalhes: ["nome: obrigatório", "preco: deve ser positivo"],
        },
      }}
    />,
  );
  expect(screen.getByRole("alert")).toHaveTextContent("nome: obrigatório");
  expect(screen.getByRole("alert")).toHaveTextContent(
    "preco: deve ser positivo",
  );
});
