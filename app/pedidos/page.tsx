const pedidos = [
  { id: "#1024", item: "Kit de higiene", status: "Em separação", data: "12 nov", cor: "bg-amber-100 text-amber-700" },
  { id: "#1021", item: "Cesta básica", status: "Em trânsito", data: "09 nov", cor: "bg-blue-100 text-blue-700" },
  { id: "#1018", item: "Roupas infantis", status: "Entregue", data: "04 nov", cor: "bg-emerald-100 text-emerald-700" },
];

export default function PedidosPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Pedidos</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">Acompanhamento de pedidos</h1>
        </div>
        <button className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500">
          Novo pedido
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Ativos</p>
          <p className="mt-4 text-3xl font-bold text-slate-900">08</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Entregues</p>
          <p className="mt-4 text-3xl font-bold text-slate-900">24</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Pendentes</p>
          <p className="mt-4 text-3xl font-bold text-slate-900">03</p>
        </div>
      </div>

      <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Últimos pedidos</h2>
          <span className="text-sm text-slate-500">Atualizado hoje</span>
        </div>

        <div className="space-y-4">
          {pedidos.map((pedido) => (
            <div key={pedido.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">Pedido {pedido.id}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{pedido.item}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${pedido.cor}`}>{pedido.status}</span>
                <span className="text-sm text-slate-500">{pedido.data}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
