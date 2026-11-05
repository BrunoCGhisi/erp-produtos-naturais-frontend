import { test, expect } from "playwright/test";
test("compras reais: fornecedor e rascunho com vários itens, edição e reload", async ({
  page,
  request,
}, testInfo) => {
  if (process.env.CATALOG_DISPOSABLE !== "1" || !process.env.PURCHASES_FIXTURE)
    throw new Error("Use npm run test:integration.");
  const fixture = JSON.parse(process.env.PURCHASES_FIXTURE);
  const name = `${fixture.prefix}-${testInfo.project.name}`;
  const stock = await (await request.get("/api/estoques")).json();
  await page.goto("/fornecedores");
  await page.getByRole("button", { name: "Novo fornecedor" }).click();
  for (const [label, value] of Object.entries({
    "Nome fantasia": name,
    "Razão social": name,
    Estado: "sc",
    Cidade: "Criciúma",
    Bairro: "Centro",
  }))
    await page
      .getByRole("dialog")
      .getByLabel(label, { exact: false })
      .fill(value);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Salvar", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.goto("/compras/nova");
  await page
    .getByLabel("Fornecedor *", { exact: true })
    .selectOption({ label: name });
  await page.getByLabel("Loja *", { exact: true }).selectOption(fixture.store);
  const fill = async (
    n: number,
    product: string,
    q: string,
    cost: string,
    discount: string,
  ) => {
    const row = page.getByLabel(`Item ${n}`, { exact: true });
    await row.getByLabel("Produto").selectOption(product);
    await row.getByLabel("Quantidade").fill(q);
    await row.getByLabel("Custo unitário").fill(cost);
    await row.getByLabel("Desconto").fill(discount);
  };
  await fill(1, fixture.product, "1,125", "2,3456", "0,10");
  await page.getByRole("button", { name: "Adicionar item" }).click();
  await fill(2, fixture.otherProduct, "0,001", "5", "0");
  await page.getByLabel("Data da compra").fill("2026-11-04T23:59:59");
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(page).toHaveURL(/\/compras\/[0-9a-f-]{36}$/);
  const url = page.url();
  await expect(page.getByText("Total salvo:", { exact: false })).toContainText(
    "2,55",
  );
  await page.reload();
  await expect(page.getByText("Data:", { exact: false })).toContainText(
    "04/11/2026",
  );
  await page.getByRole("link", { name: "Editar rascunho" }).click();
  await expect(page.getByLabel("Custo unitário").first()).toHaveValue("2,3456");
  await page.getByLabel("Quantidade").first().fill("2,125");
  await page.getByRole("button", { name: "Remover item 2" }).click();
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await expect(page).toHaveURL(url);
  await page.reload();
  await expect(page.getByText("Total salvo:", { exact: false })).toContainText(
    "4,88",
  );
  await expect(page.getByRole("row")).toHaveCount(2);
  expect(await (await request.get("/api/estoques")).json()).toEqual(stock);
  // Runner removes item rows with test-only SQL, headers and suppliers before catalog.
});
