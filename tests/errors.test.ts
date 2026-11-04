import { it, expect } from "vitest";
import { errorMessage, isMissing } from "@/lib/errors";
it.each([400, 404, 409, 422])("normaliza ApiError HTTP %s", (status) =>
  expect(
    errorMessage({
      status,
      data: { message: "Dados inválidos.", detalhes: ["sku: já cadastrado"] },
    }),
  ).toBe("Dados inválidos. sku: já cadastrado"),
);
it("oculta detalhes inesperados do servidor", () =>
  expect(
    errorMessage({ status: 500, data: { message: "SQL interno" } }),
  ).not.toContain("SQL interno"));
it("trata falhas de rede e registros ausentes", () => {
  expect(errorMessage(new Error("offline"))).toContain("Verifique a conexão");
  expect(isMissing({ response: { status: 404 } })).toBe(true);
});
