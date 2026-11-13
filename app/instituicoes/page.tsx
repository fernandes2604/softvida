"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { distanceKm, getCurrentLocation, type Coordinates } from "@/lib/geolocation";

type Institution = {
  id: string;
  nome: string;
  tipo: string;
  descricao: string | null;
  endereco: string | null;
  municipio: string | null;
  provincia: string | null;
  lat: number | null;
  lng: number | null;
};

type Enrollment = {
  instituicao_id: string;
  estado: string;
};

const institutionTypes: Record<string, string> = {
  hospital: "Hospital",
  clinica: "Clínica",
  banco_de_sangue: "Banco de sangue",
  ong: "ONG",
  outra: "Outra instituição",
};

export default function InstituicoesPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [busyInstitution, setBusyInstitution] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      setError("Não foi possível verificar a sessão.");
      return;
    }

    const currentUser = sessionData.session?.user ?? null;
    setUserId(currentUser?.id ?? null);
    if (!currentUser) {
      setRole(null);
      setEnrollments([]);
      return;
    }

    const [{ data: profile, error: profileError }, { data: rows, error: enrollmentError }] = await Promise.all([
      supabase.from("perfis").select("papel").eq("id", currentUser.id).maybeSingle(),
      supabase.from("inscricoes_bancos_sangue").select("instituicao_id, estado").eq("doador_id", currentUser.id),
    ]);

    if (profileError || enrollmentError) {
      setError("Não foi possível carregar o seu perfil e as inscrições.");
      return;
    }

    setRole(profile?.papel ?? null);
    setEnrollments((rows ?? []) as Enrollment[]);
  }, []);

  useEffect(() => {
    let active = true;

    const loadInstitutions = async () => {
      const { data, error: institutionsError } = await supabase.rpc("listar_instituicoes_publicas");
      if (!active) return;

      if (institutionsError) {
        setError("Não foi possível carregar as instituições. Verifique se a atualização do Supabase foi aplicada.");
      } else {
        setInstitutions((data ?? []) as Institution[]);
      }

      await loadSession();
      if (active) setLoading(false);
    };

    void loadInstitutions();
    return () => {
      active = false;
    };
  }, [loadSession]);

  const registerAtInstitution = async (institution: Institution) => {
    if (!userId || role !== "doador") return;
    setBusyInstitution(institution.id);
    setMessage(null);

    const { error: enrollmentError } = await supabase.rpc("inscrever_na_instituicao", {
      p_instituicao_id: institution.id,
    });

    if (enrollmentError) {
      setMessage({ type: "error", text: enrollmentError.message });
    } else {
      setEnrollments((current) => [
        ...current.filter((item) => item.instituicao_id !== institution.id),
        { instituicao_id: institution.id, estado: "pendente" },
      ]);
      setMessage({ type: "success", text: `Inscrição enviada para ${institution.nome}.` });
    }
    setBusyInstitution(null);
  };

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

  const normalizedQuery = query.trim().toLocaleLowerCase("pt");
  const filteredInstitutions = institutions.filter((institution) =>
    userLocation !== null
      && institution.lat !== null
      && institution.lng !== null
      && distanceKm(userLocation, { lat: institution.lat, lng: institution.lng }) <= 25
      && [institution.nome, institution.tipo, institution.endereco, institution.municipio, institution.provincia]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase("pt").includes(normalizedQuery)),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Instituições verificadas</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--foreground)] sm:text-4xl">Encontre onde doar</h1>
        <p className="mt-3 max-w-2xl text-sm text-[var(--muted)] sm:text-base">
          Consulte instituições cadastradas e a sua localização. Doadores podem inscrever-se nas instituições verificadas.
        </p>
      </header>

      <label className="mb-6 block">
        <span className="sr-only">Pesquisar instituições</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Pesquisar por nome, tipo ou localização"
          className="w-full rounded-xl border border-[var(--panel-border)] bg-[var(--card)] px-4 py-3 text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
        />
      </label>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => void locateUser()}
          disabled={locating}
          className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-wait disabled:opacity-60"
        >
          {locating ? "A obter localização…" : userLocation ? "Atualizar localização" : "Usar a minha localização"}
        </button>
        <p className="text-sm text-[var(--muted)]">
          {userLocation ? "A mostrar instituições a até 25 km da sua localização." : "A localização é usada para filtrar instituições num raio de 25 km."}
        </p>
      </div>
      {locationError && (
        <p role="alert" className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-[var(--danger)]">
          {locationError}
        </p>
      )}

      {message && (
        <p
          role={message.type === "error" ? "alert" : "status"}
          className={`mb-5 rounded-xl border p-4 text-sm ${
            message.type === "error"
              ? "border-rose-500/30 bg-rose-500/10 text-[var(--danger)]"
              : "border-emerald-500/30 bg-emerald-500/10 text-[var(--success)]"
          }`}
        >
          {message.text}
        </p>
      )}

      {loading ? (
        <p role="status" className="rounded-2xl border border-[var(--panel-border)] bg-[var(--card)] p-6 text-[var(--muted)]">
          A carregar instituições…
        </p>
      ) : error ? (
        <p role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-[var(--danger)]">{error}</p>
      ) : !userLocation ? (
        <p className="rounded-2xl border border-[var(--panel-border)] bg-[var(--card)] p-6 text-[var(--muted)]">
          Use a sua localização para ver instituições próximas.
        </p>
      ) : filteredInstitutions.length === 0 ? (
        <p className="rounded-2xl border border-[var(--panel-border)] bg-[var(--card)] p-6 text-[var(--muted)]">
          {institutions.length === 0
            ? "Ainda não há instituições verificadas cadastradas."
            : "Nenhuma instituição num raio de 25 km corresponde à sua pesquisa. Instituições sem coordenadas não podem ser filtradas por distância."}
        </p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredInstitutions.map((institution) => {
            const enrollment = enrollments.find((item) => item.instituicao_id === institution.id);
            const location = [institution.endereco, institution.municipio, institution.provincia].filter(Boolean).join(", ");
            const mapQuery = institution.lat !== null && institution.lng !== null
              ? `${institution.lat},${institution.lng}`
              : location;

            return (
              <article
                key={institution.id}
                className="flex flex-col rounded-2xl border border-[var(--panel-border)] bg-[var(--card)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--brand)]/50"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]" aria-hidden="true">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z" />
                    <circle cx="12" cy="9" r="2.3" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-[var(--foreground)]">{institution.nome}</h2>
                <p className="mt-1 text-sm font-medium text-[var(--brand)]">
                  {institutionTypes[institution.tipo] ?? institution.tipo.replaceAll("_", " ")}
                </p>
                {institution.descricao && (
                  <p className="mt-3 line-clamp-3 text-sm text-[var(--muted)]">{institution.descricao}</p>
                )}
                <div className="mt-4 flex items-start gap-2 text-sm text-[var(--muted)]">
                  <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z" />
                    <circle cx="12" cy="9" r="2.3" />
                  </svg>
                  <span>{location || "Localização não informada"}</span>
                </div>

                <div className="mt-auto flex flex-col gap-2 pt-5">
                  {mapQuery && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-[var(--panel-border)] px-4 py-2.5 text-center text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--card-soft)]"
                    >
                      Ver localização
                    </a>
                  )}

                  {userId && role === "doador" ? (
                    enrollment ? (
                      <p className="rounded-xl bg-[var(--brand-soft)] px-4 py-2.5 text-center text-sm font-semibold text-[var(--brand)]">
                        {enrollment.estado === "aceite"
                          ? "Inscrição aceite"
                          : enrollment.estado === "rejeitada"
                            ? "Inscrição rejeitada"
                            : "Inscrição enviada"}
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void registerAtInstitution(institution)}
                        disabled={busyInstitution === institution.id}
                        className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-wait disabled:opacity-60"
                      >
                        {busyInstitution === institution.id ? "A enviar…" : "Inscrever-me nesta instituição"}
                      </button>
                    )
                  ) : userId ? (
                    <p className="rounded-xl bg-[var(--card-soft)] px-4 py-2.5 text-center text-sm text-[var(--muted)]">
                      Inscrição disponível para contas de doador.
                    </p>
                  ) : (
                    <Link
                      href="/auth"
                      className="rounded-xl bg-rose-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-rose-500"
                    >
                      Entrar para me inscrever
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
