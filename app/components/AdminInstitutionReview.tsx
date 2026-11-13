"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AdminDonorSummary from "@/app/components/AdminDonorSummary";
import { supabase } from "@/lib/supabase";

type Institution = {
  id: string;
  nome: string;
  tipo: string;
  nif: string | null;
  telefone: string | null;
  endereco: string | null;
  criado_em: string;
};

const institutionTypeLabels: Record<string, string> = {
  hospital: "Hospital",
  clinica: "Clínica",
  banco_de_sangue: "Banco de sangue",
  ong: "ONG",
  outra: "Outra",
};

export default function AdminInstitutionReview() {
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadPendingInstitutions = useCallback(async () => {
    setLoadingInstitutions(true);
    const { data, error } = await supabase
      .from("instituicoes")
      .select("id, nome, tipo, nif, telefone, endereco, criado_em")
      .eq("estado", "pendente")
      .order("criado_em", { ascending: true });

    if (error) {
      setMessage({ type: "error", text: `Não foi possível carregar as instituições: ${error.message}` });
    } else {
      setInstitutions((data ?? []) as Institution[]);
    }

    setLoadingInstitutions(false);
  }, []);

  useEffect(() => {
    let active = true;

    const checkAdmin = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;

      if (sessionError) {
        setMessage({ type: "error", text: `Não foi possível validar a sessão: ${sessionError.message}` });
        setCheckingAccess(false);
        return;
      }

      const user = sessionData.session?.user;
      if (!user) {
        setCheckingAccess(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("perfis")
        .select("papel")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;

      if (profileError) {
        setMessage({ type: "error", text: `Não foi possível validar o perfil: ${profileError.message}` });
        setCheckingAccess(false);
        return;
      }

      const authorized = profile?.papel === "admin";
      setIsAdmin(authorized);
      setCheckingAccess(false);

      if (authorized) {
        await loadPendingInstitutions();
      }
    };

    void checkAdmin();
    return () => {
      active = false;
    };
  }, [loadPendingInstitutions]);

  const updateInstitutionStatus = async (institution: Institution, status: "verificada" | "rejeitada") => {
    setUpdatingId(institution.id);
    setMessage(null);

    const { error } = await supabase.rpc("definir_estado_instituicao", {
      p_id: institution.id,
      p_estado: status,
    });

    if (error) {
      setMessage({ type: "error", text: `Não foi possível atualizar ${institution.nome}: ${error.message}` });
    } else {
      setInstitutions((current) => current.filter((item) => item.id !== institution.id));
      setMessage({
        type: "success",
        text: status === "verificada"
          ? `${institution.nome} foi verificada.`
          : `O cadastro de ${institution.nome} foi rejeitado.`,
      });
    }

    setUpdatingId(null);
  };

  if (checkingAccess) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-zinc-400">
        A validar acesso...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-300">Acesso restrito</p>
          <h1 className="mt-3 text-2xl font-bold text-white">Área de administração</h1>
          <p className="mt-3 text-sm text-zinc-400">
            Inicie sessão com uma conta que tenha o perfil de administrador para continuar.
          </p>
          <Link href="/auth" className="mt-6 inline-flex rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-500">
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-300">SoftVida</p>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Administração</h1>
          <p className="mt-2 text-sm text-zinc-400">Revise e verifique os cadastros de instituições.</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3">
          <span className="text-sm text-zinc-400">Pendentes</span>
          <p className="mt-1 text-2xl font-bold text-white">{institutions.length}</p>
        </div>
      </header>

      {message && (
        <div
          role="status"
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/40 bg-rose-500/10 text-rose-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <AdminDonorSummary />

      <section aria-labelledby="pending-institutions-heading">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="pending-institutions-heading" className="text-xl font-semibold text-white">
            Instituições a verificar
          </h2>
          <button
            type="button"
            onClick={() => void loadPendingInstitutions()}
            disabled={loadingInstitutions}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
          >
            {loadingInstitutions ? "A atualizar..." : "Atualizar"}
          </button>
        </div>

        {loadingInstitutions && institutions.length === 0 ? (
          <p className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">
            A carregar instituições...
          </p>
        ) : institutions.length === 0 && message?.type !== "error" ? (
          <p className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-400">
            Não há instituições pendentes de verificação.
          </p>
        ) : institutions.length > 0 ? (
          <div className="space-y-4">
            {institutions.map((institution) => (
              <article key={institution.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{institution.nome}</h3>
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">
                        Pendente
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-400">{institutionTypeLabels[institution.tipo] ?? institution.tipo}</p>
                    <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="inline text-zinc-500">NIF: </dt>
                        <dd className="inline text-zinc-300">{institution.nif || "Não informado"}</dd>
                      </div>
                      <div>
                        <dt className="inline text-zinc-500">Telefone: </dt>
                        <dd className="inline text-zinc-300">{institution.telefone || "Não informado"}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="inline text-zinc-500">Endereço: </dt>
                        <dd className="inline text-zinc-300">{institution.endereco || "Não informado"}</dd>
                      </div>
                    </dl>
                    <p className="mt-3 text-xs text-zinc-500">
                      Cadastrada em {new Date(institution.criado_em).toLocaleDateString("pt-PT")}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => void updateInstitutionStatus(institution, "rejeitada")}
                      disabled={updatingId === institution.id}
                      className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
                    >
                      Rejeitar
                    </button>
                    <button
                      type="button"
                      onClick={() => void updateInstitutionStatus(institution, "verificada")}
                      disabled={updatingId === institution.id}
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {updatingId === institution.id ? "A guardar..." : "Verificar"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
