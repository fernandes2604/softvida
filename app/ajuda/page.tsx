const perguntas = [
  "Como faço um pedido?",
  "Como acompanho o status?",
  "Quem pode receber ajuda?",
  "Existe atendimento presencial?",
];

export default function AjudaPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Ajuda</p>
        <h1 className="mt-2 text-4xl font-bold text-slate-900">Central de atendimento</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Perguntas frequentes</h2>
          <div className="mt-6 space-y-3">
            {perguntas.map((pergunta) => (
              <div key={pergunta} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700">
                {pergunta}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-emerald-600 p-6 text-white shadow-sm">
          <h2 className="text-xl font-semibold">Precisa de ajuda agora?</h2>
          <p className="mt-3 text-sm text-emerald-50">
            Nossa equipe pode orientar sobre cadastro, pedidos e parcerias.
          </p>
          <div className="mt-6 space-y-3 text-sm">
            <p>📞 (81) 3333-4455</p>
            <p>✉️ atendimento@softvida.org</p>
            <p>🕒 Segunda a sábado, 8h às 18h</p>
          </div>
          <button className="mt-6 w-full rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
            Solicitar atendimento
          </button>
        </div>
      </div>
    </div>
  );
}
