import { describe, expect, it } from "vitest";
import { createCsv, csvNumber, isoTimestamp, moneyCents, periodDates, summarize, validDateRange } from "@/lib/reports";
import { selectDocuments, selectInventory, selectProducts } from "@/lib/report-selectors";
describe("reports", () => {
  it("separates statuses and sums integer cents without changing saved totals", () => {
    const rows = summarize([{status:"ABERTA",valorTotal:0.1},{status:"ABERTA",valorTotal:0.2},{status:"CONCLUIDA",valorTotal:500},{status:"CANCELADA",valorTotal:2}], ["ABERTA","CONCLUIDA","CANCELADA"]);
    expect(rows.map(r => [r.count,r.cents,r.missing])).toEqual([[2,30n,0],[1,50000n,0],[1,200n,0]]);
    expect(summarize([], ["RASCUNHO"])[0]).toEqual({status:"RASCUNHO",count:0,cents:0n,missing:0});
  });
  it("marks missing, negative, nonfinite and fractional-cent totals incomplete", () => {
    for (const value of [undefined,null,"1",NaN,Infinity,-1,0.001,1e20]) expect(moneyCents(value)).toBeUndefined();
    expect(moneyCents(0.29)).toBe(29n);
    expect(summarize([{status:"RASCUNHO"},{status:"RASCUNHO",valorTotal:1}],[])[0]).toMatchObject({count:2,cents:100n,missing:1});
    expect(summarize([{}],[])[0].status).toBe("SEM_STATUS");
  });
  it("uses the São Paulo calendar month and inclusive 30 days across year/leap boundaries", () => {
    expect(periodDates("mes",new Date("2026-11-01T02:59:59Z"))).toEqual({inicio:"2026-10-01",fim:"2026-10-31"});
    expect(periodDates("mes",new Date("2026-11-01T03:00:00Z"))).toEqual({inicio:"2026-11-01",fim:"2026-11-30"});
    expect(periodDates("30dias",new Date("2024-03-01T12:00:00Z"))).toEqual({inicio:"2024-02-01",fim:"2024-03-01"});
    expect(periodDates("30dias",new Date("2026-01-05T12:00:00Z"))).toEqual({inicio:"2025-12-07",fim:"2026-01-05"});
    expect(validDateRange("2026-02-30","2026-03-01")).toBe(false);
    expect(validDateRange("2026-11-10","2026-11-01")).toBe(false);
  });
  it("exports BOM, semicolons, CRLF, escaping and neutralizes textual formulas only", () => {
    const csv = createCsv(["Nome","Quantidade"], [["=HYPERLINK(\"bad\")",-2.125],[" \t+SUM(A1)",csvNumber(1.2,2)],["a;\"b\"\r\nc",undefined],["-10","@evil"],["\r=evil","normal"]]);
    expect(csv.startsWith('\uFEFF"Nome";"Quantidade"\r\n')).toBe(true);
    expect(csv).toContain('"\'=HYPERLINK(""bad"")";"-2,125"');
    expect(csv).toContain('"\' \t+SUM(A1)";"1,20"');
    expect(csv).toContain('"a;""b""\r\nc";""\r\n');
    expect(csv).toContain('"\'-10";"\'@evil"');
    expect(new TextEncoder().encode(csv).slice(0,3)).toEqual(new Uint8Array([239,187,191]));
  });
  it("normalizes timestamps with explicit offsets and preserves fractions", () => {
    expect(isoTimestamp("2026-11-05T10:20:30.123")).toBe("2026-11-05T10:20:30.123-03:00");
    expect(isoTimestamp("2026-11-05T10:20:30Z")).toBe("2026-11-05T10:20:30+00:00");
    expect(isoTimestamp("invalid")).toBe("");
    expect(isoTimestamp("2018-11-04T00:30:00")).toBe("");
  });
  it("shares unpaginated product selectors with table and export without mutating input", () => {
    const products = Array.from({length:25},(_,i) => ({id:String(i),nome:`Produto ${String(i).padStart(2,"0")}`,status:"ATIVO" as const,idCategoria:"cat"}));
    const selected = selectProducts(products,{busca:"Produto",categoria:"cat",status:"ATIVO",ordem:"desc"});
    expect(selected).toHaveLength(25); expect(selected[0].id).toBe("24"); expect(products[0].id).toBe("0");
    expect(selectProducts(products,{categoria:"other"})).toEqual([]);
  });
  it("applies all document filters locally, date boundaries and deterministic sorting", () => {
    const data = [{id:"a",idLoja:"s",idCliente:"c",status:"ABERTA" as const,dataVenda:"2026-11-01T02:59:59Z",valorTotal:10},{id:"b",idLoja:"s",idCliente:"c",status:"ABERTA" as const,dataVenda:"2026-11-01T03:00:00Z",valorTotal:2},{id:"c",idLoja:"other",status:"CONCLUIDA" as const,dataVenda:"2026-11-02T00:00:00Z"}];
    expect(selectDocuments(data,{idLoja:"s",idCliente:"c",status:"ABERTA",inicio:"2026-11-01",fim:"2026-11-01"},"sales").map(r=>r.id)).toEqual(["b"]);
    expect(selectDocuments(data,{ordem:"total-desc"},"sales").map(r=>r.id)).toEqual(["a","b","c"]);
    expect(selectDocuments([{id:"p",dataCompra:"2026-11-05T10:00:00",idFornecedor:"f",status:"RECEBIDA"}],{idFornecedor:"f",inicio:"2026-11-05",fim:"2026-11-05"},"purchases")).toHaveLength(1);
  });
  it("shares stock and movement filtering/sorting and keeps negative numeric quantities", () => {
    const name = (id?:string, fallback?:string) => fallback || id || "";
    const stocks = [{id:"1",idProduto:"p",idLoja:"s",quantidadeAtual:-1},{id:"2",idProduto:"p",idLoja:"other",quantidadeAtual:1}];
    expect(selectInventory(stocks,[],false,{idLoja:"s",quantidade:"negativo"},name,name).map(r=>r.amount)).toEqual([-1]);
    expect(selectInventory([], [{id:"m",idProduto:"p",idLoja:"s",tipo:"SAIDA_VENDA",dataMovimentacao:"2026-11-05T02:00:00Z",quantidade:1}],true,{idLoja:"s",tipo:"SAIDA_VENDA",inicio:"2026-11-04",fim:"2026-11-04"},name,name)).toHaveLength(1);
  });
});
