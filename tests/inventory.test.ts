import { expect, it } from "vitest";
import { inDateRange, inventoryDay, matchesIds, matchesQuantity, quantity, timestamp } from "@/lib/inventory";
it("aplica cada filtro de produto/loja independentemente", () => {
  const row = { idProduto: "p", idLoja: "l" };
  expect(matchesIds(row, "p", "")).toBe(true);
  expect(matchesIds(row, "outro", "")).toBe(false);
  expect(matchesIds(row, "", "outro")).toBe(false);
  expect(matchesIds(row, "", "l")).toBe(true);
  expect(matchesIds(row, "p", "outro")).toBe(false);
});
it("preserva três casas decimais e separadores brasileiros", () => {
  expect(quantity(1234.567)).toBe("1.234,567");
  expect(quantity(-0.125)).toBe("-0,125");
  expect(quantity(0)).toBe("0"); expect(quantity(undefined)).toBe("—");
  expect(matchesQuantity(undefined, "zero")).toBe(false);
  expect(matchesQuantity(0, "zero")).toBe(true);
  expect(matchesQuantity(-1, "negativo")).toBe(true);
  expect(matchesQuantity(0.001, "positivo")).toBe(true);
});
it("inclui o dia inteiro em São Paulo independentemente do fuso do navegador", () => {
  const start = "2026-11-04", end = start;
  expect(inDateRange("2026-11-04T02:59:59.999Z", start, end)).toBe(false);
  expect(inDateRange("2026-11-04T03:00:00Z", start, end)).toBe(true);
  expect(inDateRange("2026-11-05T02:59:59.999Z", start, end)).toBe(true);
  expect(inDateRange("2026-11-05T03:00:00Z", start, end)).toBe(false);
  expect(inventoryDay("2026-11-04T00:00:00")).toBe(start);
  expect(timestamp("2026-11-04T03:00:00Z")).toContain("00:00:00");
  expect(inDateRange(undefined, start, end)).toBe(false);
});
