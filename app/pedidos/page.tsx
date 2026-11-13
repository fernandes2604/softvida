"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Pedido = {
  id: string;
  categoria: string;
  instituicao_atribuida: string | null;
  tipo_sanguineo: string | null;
  quantidade: number;
  nivel: string;
  estado: string;
  provincia: string | null;
  municipio: string | null;
  criado_em: string;
};

const estadoLabels: Record<string, string> = {
  pendente: "Pendente",
  atribuido: "Atribuído",
  aceite: "Aceite",
  em_deslocacao: "Em deslocação",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium" }).format(new Date(date));

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadRequests = async () => {
      const { data, error: requestError } = await supabase.rpc("listar_pedidos_publicos");
      if (!active) return;

      if (requestError) {
        setError("Não foi possível carregar os pedidos. Verifique se as funções do Supabase foram aplicadas.");
      } else {
        setPedidos(data ?? []);
      }
      setLoading(false);
    };

    void loadRequests();
    return () => {
      active = false;
    };
  }, []);

  const ativos = pedidos.filter((pedido) => !["concluido", "cancelado"].includes(pedido.estado)).length;
  const concluidos = pedidos.filter((pedido) => pedido.estado === "concluido").length;
  const pendentes = pedidos.filter((pedido) => pedido.estado === "pendente").length;
  const pedidosAgrupados = Object.entries(pedidos.reduce<Record<string, Pedido[]>>((groups, pedido) => {
    const instituicao = pedido.instituicao_atribuida ?? "Aguardando atribuição";
    groups[instituicao] = [...(groups[instituicao] ?? []), pedido];
    return groups;
  }, {}));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Pedidos</p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--foreground)] sm:text-4xl">Pedidos de doação</h1>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--card)] p-6 shadow-sm">
          <p className="text-sm text-[var(--muted)]">Ativos</p>
          <p className="mt-4 text-3xl font-bold text-[var(--foreground)]">{loading ? "—" : ativos}</p>
        </div>
        <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--card)] p-6 shadow-sm">
          <p className="text-sm text-[var(--muted)]">Concluídos</p>
          <p className="mt-4 text-3xl font-bold text-[var(--foreground)]">{loading ? "—" : concluidos}</p>
        </div>
        <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--card)] p-6 shadow-sm">
          <p className="text-sm text-[var(--muted)]">Pendentes</p>
          <p className="mt-4 text-3xl font-bold text-[var(--foreground)]">{loading ? "—" : pendentes}</p>
        </div>
      </div>

      <div className="mt-10 rounded-3xl border border-[var(--panel-border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Todos os pedidos</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Pedidos públicos, sem dados pessoais do solicitante.</p>
        </div>

        {loading ? (
          <p role="status" className="py-8 text-center text-sm text-[var(--muted)]">A carregar pedidos…</p>
        ) : error ? (
          <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-[var(--danger)]">{error}</p>
        ) : pedidos.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--muted)]">Ainda não há pedidos registados.</p>
        ) : (
          <div className="space-y-6">
            {pedidosAgrupados.map(([instituicao, pedidosDaInstituicao]) => (
              <section key={instituicao} aria-label={`Pedidos atribuídos a ${instituicao}`}>
                <h3 className="mb-3 border-b border-[var(--panel-border)] pb-2 text-sm font-bold text-[var(--foreground)]">
                  {instituicao} <span className="font-normal text-[var(--muted)]">({pedidosDaInstituicao.length})</span>
                </h3>
                <div className="space-y-4">
                  {pedidosDaInstituicao.map((pedido) => (
                    <article key={pedido.id} className="flex flex-col gap-4 rounded-2xl border border-[var(--panel-border)] bg-[var(--card-soft)] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm text-[var(--muted)]">{pedido.categoria}</p>
                        <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                          {pedido.tipo_sanguineo ? `Sangue ${pedido.tipo_sanguineo}` : pedido.categoria}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {pedido.quantidade} {pedido.quantidade === 1 ? "unidade" : "unidades"}
                          {pedido.municipio ? ` · ${pedido.municipio}` : ""}
                          {pedido.provincia ? `${pedido.municipio ? ", " : " · "}${pedido.provincia}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-3">
                        <span className="rounded-full border border-[var(--panel-border)] bg-[var(--card)] px-2.5 py-1 text-xs font-semibold text-[var(--brand)]">
                          {estadoLabels[pedido.estado] ?? pedido.estado}
                        </span>
                        <span className="text-sm text-[var(--muted)]">{formatDate(pedido.criado_em)}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
