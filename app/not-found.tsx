import Link from "next/link";
import { EmptyState, PageTitle } from "@/components/feedback";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <EmptyState>
      <PageTitle>Página não encontrada</PageTitle>
      <p className="max-w-[400px] text-[12px]">
        O endereço solicitado não está disponível.
      </p>
      <Button asChild>
        <Link href="/produtos">Voltar aos produtos</Link>
      </Button>
    </EmptyState>
  );
}
