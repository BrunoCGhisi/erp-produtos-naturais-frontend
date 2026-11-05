"use client";
import { Button } from "./ui/button";
import { downloadCsv, type CsvCell } from "@/lib/reports";
type Source = { isSuccess: boolean; isFetching: boolean; isStale?: boolean; refetch: () => unknown };
export function ExportCsv({ name, headers, rows, source, incomplete = false, invalid = false }: { name: string; headers: string[]; rows: CsvCell[][]; source: Source; incomplete?: boolean; invalid?: boolean }) {
  const unavailable = !source.isSuccess || source.isFetching || !!source.isStale;
  return <div className="my-4 flex flex-wrap items-center gap-3 text-xs">
    <Button variant="outline" disabled={unavailable || invalid || !rows.length} onClick={() => downloadCsv(name, headers, rows)}>Exportar CSV ({rows.length})</Button>
    {unavailable && <><span>Exportação indisponível enquanto a consulta não estiver atualizada.</span><Button variant="outline" size="sm" disabled={source.isFetching} onClick={() => void source.refetch()}>Atualizar dados</Button></>}
    {incomplete && <span role="status">Rótulos incompletos: consultas auxiliares indisponíveis ou sem nomes; IDs usados quando disponíveis. Unidade é a atual.</span>}
  </div>;
}
