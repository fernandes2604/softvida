const instituicoes = [
  { nome: "Fundação Esperança", tipo: "Apoio alimentar", cidade: "Recife", meta: "12 famílias atendidas" },
  { nome: "Casa de Solidariedade", tipo: "Roupas e higiene", cidade: "Olinda", meta: "28 kits entregues" },
  { nome: "Projeto Cuidar", tipo: "Saúde e bem-estar", cidade: "Jaboatão", meta: "4 atendimentos semanais" },
];

export default function InstituicoesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Instituições</p>
        <h1 className="mt-2 text-4xl font-bold text-slate-900">Parcerias solidárias</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {instituicoes.map((instituicao) => (
          <article key={instituicao.nome} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-xl text-emerald-700">❤</div>
            <h2 className="text-xl font-bold text-slate-900">{instituicao.nome}</h2>
            <p className="mt-2 text-sm text-emerald-700">{instituicao.tipo}</p>
            <p className="mt-4 text-sm text-slate-500">{instituicao.cidade}</p>
            <p className="mt-6 rounded-2xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">{instituicao.meta}</p>
            <button className="mt-6 w-full rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700">
              Ver detalhes
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
