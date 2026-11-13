"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCurrentLocation, type Coordinates } from "@/lib/geolocation";

type Resultado = {
  tipo_resultado: "pedido" | "instituicao" | "doador";
  id: string;
  titulo: string;
  telefone: string | null;
  tipo_instituicao: string | null;
  categoria: string | null;
  instituicao_atribuida: string | null;
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
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const pedidos = results.filter((result) => result.tipo_resultado === "pedido");
  const instituicoes = results.filter((result) => result.tipo_resultado === "instituicao");
  const doadores = results.filter((result) => result.tipo_resultado === "doador");
  const pedidosAgrupados = Object.entries(pedidos.reduce<Record<string, Resultado[]>>((groups, pedido) => {
    const institution = pedido.instituicao_atribuida ?? "Aguardando atribuição";
    groups[institution] = [...(groups[institution] ?? []), pedido];
    return groups;
  }, {}));

  const locateUser = async () => {
    setLocating(true);
    setLocationError(null);
    try {
      setUserLocation(await getCurrentLocation());
    } catch (locationRequestError) {
      setLocationError(locationRequestError instanceof Error
        ? locationRequestError.message
        : "Não foi possível determinar a localização deste dispositivo.");
    } finally {
      setLocating(false);
    }
  };

  const renderResult = (result: Resultado) => (
    <article key={`${result.tipo_resultado}-${result.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {result.tipo_resultado === "doador" ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
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
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                {result.tipo_resultado === "pedido" ? "Pedido de doação" : "Instituição verificada"}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">
                {result.tipo_resultado === "pedido" && result.tipo_sanguineo
                  ? `Sangue ${result.tipo_sanguineo}`
                  : result.titulo}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {result.tipo_resultado === "instituicao"
                  ? result.tipo_instituicao?.replaceAll("_", " ")
                  : result.categoria}
                {result.municipio ? ` · ${result.municipio}` : ""}
                {result.provincia ? `${result.municipio ? ", " : " · "}${result.provincia}` : ""}
              </p>
              {result.tipo_resultado === "pedido" && (
                <p className="mt-2 text-sm text-slate-600">
                  Instituição atribuída: <span className="font-semibold text-slate-800">{result.instituicao_atribuida ?? "Aguardando atribuição"}</span>
                </p>
              )}
            </>
          )}
        </div>
        {result.estado && (
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {result.estado.replaceAll("_", " ")}
          </span>
        )}
      </div>
    </article>
  );

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
        supabase.rpc("pesquisar_pedidos_instituicoes", {
          p_termo: query,
          p_lat: userLocation?.lat ?? null,
          p_lng: userLocation?.lng ?? null,
        }),
        supabase.rpc("pesquisar_doadores", {
          p_termo: query,
          p_lat: userLocation?.lat ?? null,
          p_lng: userLocation?.lng ?? null,
        }),
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
          instituicao_atribuida: null,
          tipo_sanguineo: donor.tipo_sanguineo,
          provincia: donor.provincia,
          municipio: donor.municipio,
          estado: null,
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
  }, [query, userLocation]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-700">Pesquisa</p>
      <h1 className="mt-2 break-words text-3xl font-bold text-slate-900 sm:text-4xl">
        Resultados para {query ? `“${query}”` : "a sua pesquisa"}
      </h1>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => void locateUser()}
          disabled={locating}
          className="w-fit rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-wait disabled:opacity-60"
        >
          {locating ? "A obter localização…" : userLocation ? "Atualizar localização" : "Usar a minha localização"}
        </button>
        <p className="text-sm text-slate-600">
          {userLocation ? "Instituições e doadores são filtrados num raio de 25 km." : "Ative a localização para ver instituições e doadores próximos."}
        </p>
      </div>
      {locationError && (
        <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {locationError}
        </p>
      )}

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
                Só aparecem doadores que autorizaram a partilha dos seus dados na pesquisa.
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
            <aside
              aria-labelledby="pedidos-title"
              className="self-start rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
            >
              <h2 id="pedidos-title" className="mb-3 text-xl font-bold text-slate-900">Pedidos de doação</h2>
              {pedidosAgrupados.length > 0 ? (
                <div className="space-y-5">
                  {pedidosAgrupados.map(([instituicao, pedidosDaInstituicao]) => (
                    <section key={instituicao} aria-label={`Pedidos atribuídos a ${instituicao}`}>
                      <h3 className="mb-2 border-b border-slate-200 pb-2 text-sm font-bold text-slate-800">
                        {instituicao} <span className="font-normal text-slate-500">({pedidosDaInstituicao.length})</span>
                      </h3>
                      <div className="space-y-3">{pedidosDaInstituicao.map(renderResult)}</div>
                    </section>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">Nenhum pedido encontrado.</p>
              )}
            </aside>

            <div className="space-y-8">
              <section aria-labelledby="instituicoes-title">
                <h2 id="instituicoes-title" className="mb-3 text-xl font-bold text-slate-900">Instituições</h2>
                <div className="space-y-3">
                  {instituicoes.length > 0
                    ? instituicoes.map(renderResult)
                    : <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                        {userLocation ? "Nenhuma instituição próxima corresponde à pesquisa." : "Ative a localização para ver instituições próximas."}
                      </p>}
                </div>
              </section>

              <section aria-labelledby="doadores-title">
                <h2 id="doadores-title" className="mb-3 text-xl font-bold text-slate-900">Doadores</h2>
                <div className="space-y-3">
                  {doadores.length > 0
                    ? doadores.map(renderResult)
                    : <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                        {!userLocation
                          ? "Ative a localização para procurar doadores próximos."
                          : isAuthenticated
                            ? "Nenhum doador próximo corresponde à pesquisa ou autorizou a partilha dos seus dados."
                            : "Inicie sessão para ver doadores próximos que autorizaram a partilha dos seus dados."}
                      </p>}
                </div>
              </section>
            </div>
          </div>
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
