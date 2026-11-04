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
const links = [
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/categorias", label: "Categorias", icon: Tags },
  { href: "/unidades-medida", label: "Unidades de medida", icon: Ruler },
  { href: "/lojas", label: "Lojas", icon: Store },
];
function Brand() {
  return (
    <Link href="/produtos" className="brand">
      <span className="brand-mark">
        <Leaf size={25} />
      </span>
      <span>
        Vila Verde<small>GESTÃO DO CATÁLOGO</small>
      </span>
    </Link>
  );
}
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const current = links.find((x) => path.startsWith(x.href));
  const nav = (
    <nav aria-label="Navegação principal">
      <p className="nav-caption">CATÁLOGO</p>
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={path.startsWith(href) ? "page" : undefined}
          onClick={() => setOpen(false)}
        >
          <Icon size={19} />
          {label}
        </Link>
      ))}
    </nav>
  );
  return (
    <div className="app-shell">
      <a href="#conteudo" className="skip-link">
        Pular para conteúdo
      </a>
      <aside className="sidebar">
        <Brand />
        {nav}
        <div className="sidebar-bottom">
          <Sprout size={22} />
          <p>
            Organizado para crescer.
            <small>Produtos naturais, gestão simples.</small>
          </p>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="mobile-menu">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Abrir menu">
                  <Menu size={22} />
                </Button>
              </DialogTrigger>
              <DialogContent className="drawer">
                <DialogTitle>Vila Verde</DialogTitle>
                <DialogDescription>Navegue pelo catálogo.</DialogDescription>
                {nav}
              </DialogContent>
            </Dialog>
          </div>
          <div className="breadcrumbs">
            <Link href="/produtos">Catálogo</Link>
            <ChevronRight size={14} />
            <span>
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
          <span className="environment">
            <span />
            Ambiente de desenvolvimento
          </span>
        </header>
        <main id="conteudo" tabIndex={-1}>
          {children}
        </main>
        <footer>
          Vila Verde <span>Catálogo de produtos naturais</span>
        </footer>
      </div>
    </div>
  );
}
