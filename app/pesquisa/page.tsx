"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Resultado = {
  tipo_resultado: "pedido" | "instituicao" | "doador";
  id: string;
  titulo: string;
  telefone: string | null;
  tipo_instituicao: string | null;
  categoria: string | null;
  tipo_sanguineo: string | null;
  provincia: string | null;
  municipio: string | null;
  estado: string | null;
  criado_em: string | null;
};

type ResultadoDoador = {
  id: string;
  nome: string;
  telefone: string | null;
  tipo_sanguineo: string;
  provincia: string | null;
  municipio: string | null;
};

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const [results, setResults] = useState<Resultado[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
      const [session, search, donors] = await Promise.all([
        supabase.auth.getSession(),
        supabase.rpc("pesquisar_pedidos_instituicoes", { p_termo: query }),
        supabase.rpc("pesquisar_doadores", { p_termo: query }),
      ]);
      if (!active) return;

      if (session.error || search.error || donors.error) {
        setError("Não foi possível pesquisar. Verifique se as funções do Supabase foram aplicadas.");
      } else {
        setIsAuthenticated(Boolean(session.data.session));
        const donorResults: Resultado[] = ((donors.data ?? []) as ResultadoDoador[]).map((donor) => ({
          tipo_resultado: "doador",
          id: donor.id,
          titulo: donor.nome,
          telefone: donor.telefone,
          tipo_instituicao: null,
          categoria: null,
          tipo_sanguineo: donor.tipo_sanguineo,
          provincia: donor.provincia,
          municipio: donor.municipio,
          estado: "disponível",
          criado_em: null,
        }));
        setResults([...(search.data ?? []), ...donorResults]);
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
          <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
            Pesquise por nome de doador, tipo sanguíneo (por exemplo, A+), instituição ou província/município.
          </p>
        ) : loading ? (
          <p role="status" className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">A pesquisar…</p>
        ) : error ? (
          <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">{error}</p>
        ) : results.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
            <p>Não foram encontrados resultados para “{query}”.</p>
            {!isAuthenticated && (
              <p className="mt-2">
                Para pesquisar doadores, <Link href="/auth" className="font-semibold text-rose-700 underline">inicie sessão</Link>.
                Só aparecem doadores disponíveis que autorizaram a partilha do nome e da localização.
              </p>
            )}
          </div>
        ) : (
          results.map((result) => (
            <article key={`${result.tipo_resultado}-${result.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                    {result.tipo_resultado === "pedido"
                      ? "Pedido de doação"
                      : result.tipo_resultado === "doador"
                        ? "Doador disponível"
                        : "Instituição verificada"}
                  </p>
                  {result.tipo_resultado === "doador" ? (
                    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                        <div>
                          <dt className="text-slate-500">Nome</dt>
                          <dd className="font-semibold text-slate-900">{result.titulo}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Tipo sanguíneo</dt>
                          <dd className="font-semibold text-slate-900">{result.tipo_sanguineo}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Telefone</dt>
                          <dd className="font-semibold text-slate-900">
                            {result.telefone ? (
                              <a href={`tel:${result.telefone}`} className="underline decoration-rose-500 underline-offset-2">
                                {result.telefone}
                              </a>
                            ) : "Não informado"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-500">Lugar de residência</dt>
                          <dd className="font-semibold text-slate-900">
                            {[result.municipio, result.provincia].filter(Boolean).join(", ")}
                          </dd>
                        </div>
                    </dl>
                  ) : (
                    <>
                        <h2 className="mt-1 text-lg font-semibold text-slate-900">
                          {result.tipo_resultado === "pedido" && result.tipo_sanguineo
                            ? `Sangue ${result.tipo_sanguineo}`
                            : result.titulo}
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                          {result.tipo_resultado === "instituicao"
                            ? result.tipo_instituicao?.replaceAll("_", " ")
                            : result.categoria}
                          {result.municipio ? ` · ${result.municipio}` : ""}
                          {result.provincia ? `${result.municipio ? ", " : " · "}${result.provincia}` : ""}
                        </p>
                    </>
                  )}
                </div>
                {result.estado && result.tipo_resultado !== "doador" && (
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
