"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type BloodGroup = { tipo: string; quantidade: number };
type Donor = {
  id: string;
  nome: string;
  telefone: string | null;
  tipo_sanguineo: string | null;
  elegivel: boolean;
  disponivel: boolean;
  proxima_doacao_em: string | null;
  doacoes_registadas: number;
};
type DonorSummary = {
  total: number;
  elegiveis: number;
  nao_elegiveis: number;
  disponiveis: number;
  indisponiveis: number;
  tipos_sanguineos: BloodGroup[];
  doadores: Donor[];
};

const bloodGroupColors: Record<string, string> = {
  "O+": "#f43f5e",
  "O-": "#fb7185",
  "A+": "#3b82f6",
  "A-": "#60a5fa",
  "B+": "#14b8a6",
  "B-": "#2dd4bf",
  "AB+": "#f59e0b",
  "AB-": "#fbbf24",
  "Não informado": "#71717a",
};

const emptySummary: DonorSummary = {
  total: 0,
  elegiveis: 0,
  nao_elegiveis: 0,
  disponiveis: 0,
  indisponiveis: 0,
  tipos_sanguineos: [],
  doadores: [],
};

function PieChart({ groups }: { groups: BloodGroup[] }) {
  const total = groups.reduce((sum, group) => sum + group.quantidade, 0);
  let currentAngle = 0;
  const slices = groups
    .filter((group) => group.quantidade > 0)
    .map((group) => {
      const start = currentAngle;
      currentAngle += (group.quantidade / (total || 1)) * 360;
      return `${bloodGroupColors[group.tipo] ?? "#71717a"} ${start}deg ${currentAngle}deg`;
    });
  const background = total > 0
    ? `conic-gradient(${slices.join(", ")})`
    : "#27272a";

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div
        role="img"
        aria-label={`Distribuição dos tipos sanguíneos entre ${total} doadores`}
        className="h-44 w-44 shrink-0 rounded-full"
        style={{ background }}
      />
      <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-2">
        {groups.map((group) => (
          <li key={group.tipo} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-zinc-300">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: bloodGroupColors[group.tipo] ?? "#71717a" }} />
              <span className="truncate">{group.tipo}</span>
            </span>
            <span className="font-semibold tabular-nums text-white">{group.quantidade}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SummaryCard({ label, value, detail, color }: { label: string; value: number; detail: string; color: string }) {
  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{detail}</p>
    </article>
  );
}

export default function AdminDonorSummary() {
  const [summary, setSummary] = useState<DonorSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    const { data, error: rpcError } = await supabase.rpc("admin_resumo_doadores");

    if (rpcError) {
      setError(`Não foi possível carregar o resumo dos doadores: ${rpcError.message}`);
    } else if (data && typeof data === "object") {
      setSummary(data as DonorSummary);
    } else {
      setError("O Supabase devolveu um resumo de doadores inválido.");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    // Load the dashboard's initial data after the component mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSummary();
  }, [loadSummary]);

  const refresh = () => {
    setLoading(true);
    setError(null);
    void loadSummary();
  };

  return (
    <section aria-labelledby="donor-summary-heading" className="mb-12">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-300">Doadores</p>
          <h2 id="donor-summary-heading" className="mt-2 text-2xl font-bold text-white">
            Resumo e disponibilidade
          </h2>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? "A atualizar..." : "Atualizar dados"}
        </button>
      </header>

      {error && (
        <p role="alert" className="mb-5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total de doadores" value={summary.total} detail="Perfis de doador registados" color="text-white" />
        <SummaryCard label="Elegíveis" value={summary.elegiveis} detail="Segundo os critérios atuais de aptidão" color="text-emerald-300" />
        <SummaryCard label="Não elegíveis" value={summary.nao_elegiveis} detail="Requerem avaliação ou atualização do perfil" color="text-amber-300" />
        <SummaryCard label="Disponíveis" value={summary.disponiveis} detail={`${summary.indisponiveis} indisponíveis`} color="text-sky-300" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
          <h3 className="mb-5 text-lg font-semibold text-white">Tipos sanguíneos</h3>
          {loading && summary.total === 0 ? (
            <p className="text-sm text-zinc-400">A carregar distribuição...</p>
          ) : (
            <PieChart groups={summary.tipos_sanguineos} />
          )}
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
          <h3 className="text-lg font-semibold text-white">Doações registadas em instituições</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Registos da tabela de doações, agrupados por doador.
          </p>
          {loading && summary.total === 0 ? (
            <p className="mt-5 text-sm text-zinc-400">A carregar lista...</p>
          ) : summary.doadores.length === 0 ? (
            <p className="mt-5 text-sm text-zinc-400">Ainda não há doadores registados.</p>
          ) : (
            <div className="mt-4 max-h-[28rem] overflow-auto">
              <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                <thead className="sticky top-0 bg-zinc-950 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th scope="col" className="px-3 py-3 font-medium">Doador</th>
                    <th scope="col" className="px-3 py-3 font-medium">Tipo</th>
                    <th scope="col" className="px-3 py-3 font-medium">Elegibilidade</th>
                    <th scope="col" className="px-3 py-3 font-medium">Disponibilidade</th>
                    <th scope="col" className="px-3 py-3 text-right font-medium">Doações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {summary.doadores.map((donor) => (
                    <tr key={donor.id} className="text-zinc-300">
                      <td className="px-3 py-3">
                        <p className="font-medium text-white">{donor.nome}</p>
                        <p className="mt-0.5 text-xs text-zinc-500">{donor.telefone || "Sem telefone"}</p>
                      </td>
                      <td className="px-3 py-3">{donor.tipo_sanguineo || "Não informado"}</td>
                      <td className="px-3 py-3">
                        <span className={donor.elegivel ? "text-emerald-300" : "text-amber-300"}>
                          {donor.elegivel ? "Elegível" : "Não elegível"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={donor.disponivel ? "text-sky-300" : "text-zinc-500"}>
                          {donor.disponivel ? "Disponível" : "Indisponível"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums text-white">
                        {donor.doacoes_registadas}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
