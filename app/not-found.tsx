import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty">
      <h1>Página não encontrada</h1>
      <p>O endereço solicitado não está disponível.</p>
      <Link className="button button-primary" href="/produtos">
        Voltar aos produtos
      </Link>
    </div>
  );
}
