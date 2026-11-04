"use client";
import { PageTitle } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { Notice, NoticeDescription } from "@/components/ui/notice";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <Notice variant="error" role="alert">
      <div>
        <PageTitle>Não foi possível abrir esta página</PageTitle>
        <NoticeDescription>Tente novamente para continuar.</NoticeDescription>
        <Button onClick={reset}>Tentar novamente</Button>
      </div>
    </Notice>
  );
}
