"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Resultado = {
  tipo_resultado: "pedido" | "instituicao";
  id: string;
  titulo: string;
  tipo_instituicao: string | null;
  categoria: string | null;
  tipo_sanguineo: string | null;
  provincia: string | null;
  municipio: string | null;
  estado: string | null;
  criado_em: string | null;
};

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const [results, setResults] = useState<Resultado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const search = async () => {
      if (!query) {
        setResults([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      const { data, error: searchError } = await supabase.rpc("pesquisar_pedidos_instituicoes", { p_termo: query });
      if (!active) return;

      if (searchError) {
        setError("Não foi possível pesquisar. Verifique se as funções do Supabase foram aplicadas.");
      } else {
        setResults(data ?? []);
      }
      setLoading(false);
    };

    void search();
    return () => {
      active = false;
    };
  }, [query]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-700">Pesquisa</p>
      <h1 className="mt-2 break-words text-3xl font-bold text-slate-900 sm:text-4xl">
        Resultados para {query ? `“${query}”` : "a sua pesquisa"}
      </h1>

      <section className="mt-8 space-y-4" aria-label="Resultados da pesquisa">
        {!query ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">Pesquise por tipo sanguíneo (por exemplo, A+) ou pelo nome de uma instituição.</p>
        ) : loading ? (
          <p role="status" className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">A pesquisar…</p>
        ) : error ? (
          <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">{error}</p>
        ) : results.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">Não foram encontrados pedidos de sangue ou instituições verificadas com esse termo.</p>
        ) : (
          results.map((result) => (
            <article key={`${result.tipo_resultado}-${result.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                    {result.tipo_resultado === "pedido" ? "Pedido de doação" : "Instituição verificada"}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">
                    {result.tipo_resultado === "pedido" && result.tipo_sanguineo
                      ? `Sangue ${result.tipo_sanguineo}`
                      : result.titulo}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {result.tipo_resultado === "instituicao" ? result.tipo_instituicao?.replaceAll("_", " ") : result.categoria}
                    {result.municipio ? ` · ${result.municipio}` : ""}
                    {result.provincia ? `${result.municipio ? ", " : " · "}${result.provincia}` : ""}
                  </p>
                </div>
                {result.estado && (
                  <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {result.estado.replaceAll("_", " ")}
                  </span>
                )}
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

export default function PesquisaPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-12 text-slate-600">A carregar pesquisa…</div>}>
      <SearchResults />
    </Suspense>
  );
}
