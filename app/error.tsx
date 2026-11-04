"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="notice notice-error" role="alert">
      <div>
        <h1>Não foi possível abrir esta página</h1>
        <p>Tente novamente para continuar.</p>
        <button className="button button-primary" onClick={reset}>
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
