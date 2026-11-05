"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Leaf,
  Package,
  Tags,
  Ruler,
  Store,
  Menu,
  ChevronRight,
  Sprout,
} from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
const links = [
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/categorias", label: "Categorias", icon: Tags },
  { href: "/unidades-medida", label: "Unidades de medida", icon: Ruler },
  { href: "/lojas", label: "Lojas", icon: Store },
];
const inventoryLinks = [
  { href: "/estoque", label: "Saldos", icon: Package },
  { href: "/estoque/movimentacoes", label: "Movimentações", icon: Store },
];
function Brand() {
  return (
    <Link
      href="/produtos"
      className="flex items-center gap-[11px] px-[7px] text-[23px] font-[650] tracking-[-0.8px] compact:text-[20px]"
    >
      <span className="flex rounded-xl bg-[#e9f2e9] p-[9px] text-primary">
        <Leaf size={25} />
      </span>
      <span>
        Vila Verde
        <small className="mt-px block text-[8px] tracking-[1.7px] text-[#798579]">
          GESTÃO DO CATÁLOGO
        </small>
      </span>
    </Link>
  );
}
function Navigation({
  path,
  onNavigate,
  className,
}: {
  path: string;
  onNavigate: () => void;
  className?: string;
}) {
  return (
    <nav
      aria-label="Navegação principal"
      className={cn("mt-[46px]", className)}
    >
      <p className="px-3.5 pb-2.5 text-[10px] font-semibold tracking-[1.8px] text-[#8a958c]">
        CATÁLOGO
      </p>
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={path.startsWith(href) ? "page" : undefined}
          onClick={onNavigate}
          className="my-[5px] flex items-center gap-3 rounded-[7px] px-3.5 py-3 font-medium text-[#617067] hover:bg-[#f3f6f2] aria-[current=page]:bg-[#eaf3eb] aria-[current=page]:font-[650] aria-[current=page]:text-[#236840]"
        >
          <Icon size={19} />
          {label}
        </Link>
      ))}
      <p className="mt-6 px-3.5 pb-2 text-[10px] font-semibold tracking-[1.8px] text-muted">ESTOQUE</p>
      {inventoryLinks.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} onClick={onNavigate} aria-current={path === href ? "page" : undefined}
          className="my-[5px] flex items-center gap-3 rounded-[7px] px-3.5 py-3 text-[#617067] hover:bg-[#f3f6f2] aria-[current=page]:bg-[#eaf3eb] aria-[current=page]:text-primary">
          <Icon size={19} />{label}
        </Link>
      ))}
    </nav>
  );
}
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname(),
    [open, setOpen] = useState(false);
  const current = [...inventoryLinks].reverse().find((x) => path === x.href) || links.find((x) => path.startsWith(x.href));
  return (
    <div className="flex min-h-screen">
      <a
        href="#conteudo"
        className="fixed -top-[100px] left-3 z-100 bg-white p-3 focus:top-3"
      >
        Pular para conteúdo
      </a>
      <aside className="fixed inset-y-0 left-0 flex w-[246px] flex-col border-r border-border bg-white px-5 py-[31px] compact:w-[210px] compact:px-[13px] compact:py-7 mobile:hidden">
        <Brand />
        <Navigation path={path} onNavigate={() => setOpen(false)} />
        <div className="mt-auto flex gap-2.5 border-t border-border px-[5px] pt-6 text-[11px] text-[#5b7e61]">
          <Sprout size={22} />
          <p>
            Organizado para crescer.
            <small className="mt-[3px] block text-[10px] text-[#7e8980]">
              Produtos naturais, gestão simples.
            </small>
          </p>
        </div>
      </aside>
      <div className="ml-[246px] flex w-[calc(100%-246px)] flex-col compact:ml-[210px] compact:w-[calc(100%-210px)] mobile:ml-0 mobile:w-full">
        <header className="flex h-[78px] items-center justify-between gap-4 border-b border-border bg-[#ffffffb0] px-[42px] compact:px-[25px] mobile:h-16 mobile:justify-start mobile:px-4">
          <div className="hidden mobile:block">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Abrir menu">
                  <Menu size={22} />
                </Button>
              </DialogTrigger>
              <DialogContent className="top-0 left-0 h-dvh max-h-none w-[290px] translate-none rounded-none">
                <DialogTitle>Vila Verde</DialogTitle>
                <DialogDescription>Navegue pelo catálogo.</DialogDescription>
                <Navigation
                  path={path}
                  onNavigate={() => setOpen(false)}
                  className="mt-5"
                />
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex items-center gap-3 text-[12px] text-[#7b877e] mobile:gap-[7px] mobile:text-[11px]">
            <Link href={path.startsWith("/estoque") ? "/estoque" : "/produtos"}>{path.startsWith("/estoque") ? "Estoque" : "Catálogo"}</Link>
            <ChevronRight size={14} />
            <span className="text-[#3b5142]">
              {current?.label || "Página"}
              {path.endsWith("/novo")
                ? " / Novo produto"
                : path.endsWith("/editar")
                  ? " / Editar produto"
                  : path.startsWith("/produtos/")
                    ? " / Detalhes"
                    : ""}
            </span>
          </div>
          <span className="flex items-center gap-[7px] text-[10px] tracking-[0.2px] text-[#79877b] compact:hidden">
            <span className="size-1.5 rounded-full bg-[#8cae71]" />
            Ambiente de desenvolvimento
          </span>
        </header>
        <main
          id="conteudo"
          tabIndex={-1}
          className="m-auto w-full max-w-[1600px] flex-1 px-[42px] pt-[39px] pb-[60px] compact:px-[25px] compact:pt-[30px] compact:pb-[45px] mobile:px-4 mobile:pt-[25px] mobile:pb-10 wide:pt-[50px]"
        >
          {children}
        </main>
        <footer className="mx-[42px] flex justify-between border-t border-border py-[18px] text-[10px] text-[#859086] compact:mx-[25px] mobile:mx-4 mobile:text-[9px]">
          Vila Verde <span>Catálogo de produtos naturais</span>
        </footer>
      </div>
    </div>
  );
}
