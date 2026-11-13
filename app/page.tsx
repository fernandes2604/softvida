import Link from "next/link";
import BloodTypeRotator from "./components/tipoSangue";

const provinces = [
  "Bengo","Benguela","Bié","Cabinda","Cuando","Cubango","Cuanza Norte","Cuanza Sul","Cunene","Huambo","Huíla",
  "Icolo e Bengo","Luanda","Lunda Norte","Lunda Sul","Malanje","Moxico","Moxico Leste","Namibe","Uíge","Zaire",
];

const categories = [
  { icon: "🩸", title: "Sangue", desc: "Alertas por tipo sanguíneo e compatibilidade." },
  { icon: "🍲", title: "Alimentos", desc: "Cestas básicas e refeições para famílias e instituições." },
  { icon: "👕", title: "Roupa e calçado", desc: "Peças em bom estado para quem precisa." },
  { icon: "💊", title: "Medicamentos", desc: "Pedidos de medicamentos para apoio imediato." },
  { icon: "🧼", title: "Higiene", desc: "Produtos de higiene para lares, hospitais e abrigos." },
  { icon: "💛", title: "Doações financeiras", desc: "Apoio direto a instituições verificadas." },
  { icon: "🤝", title: "Voluntariado", desc: "O seu tempo também salva vidas." },
];

const benefits = [
  { icon: "📍", title: "Alertas próximos", desc: "Recebe pedidos relevantes da sua província e do seu tipo sanguíneo." },
  { icon: "🏥", title: "Instituições verificadas", desc: "Hospitais, clínicas e bancos de sangue só entram após validação." },
  { icon: "🔒", title: "Privacidade", desc: "Você escolhe o que partilhar e com quem." },
  { icon: "✅", title: "Aptidão clara", desc: "Acompanhe a sua disponibilidade e o histórico de doações." },
  { icon: "📈", title: "Histórico completo", desc: "O registo é mantido para o acompanhamento da sua contribuição." },
  { icon: "📱", title: "Resposta rápida", desc: "A comunicação com a instituição pode ser feita por app ou WhatsApp." },
];

const steps = [
  { number: "1", title: "Crie a conta", desc: "Registe-se como doador ou instituição em poucos minutos." },
  { number: "2", title: "Complete o perfil", desc: "Tipo sanguíneo, localização, dados de saúde e preferências." },
  { number: "3", title: "Receba alertas", desc: "Recebe notificações quando a necessidade surgir perto de si." },
  { number: "4", title: "Doe e salve vidas", desc: "Compareça na instituição e acompanhe o impacto da sua doação." },
];

const testimonials = [
  { quote: "Recebi um alerta e em menos de duas horas consegui ajudar uma família em situação crítica.", name: "António M.", role: "Doador em Luanda", blood: "O+" },
  { quote: "A plataforma ajudou-nos a responder com rapidez a pedidos de sangue e outros materiais essenciais.", name: "Dra. Fernanda S.", role: "Directora Clínica", blood: "Hosp." },
  { quote: "É simples, rápido e faz sentido. Sinto que estou a fazer parte de algo importante.", name: "Carlos B.", role: "Doador em Benguela", blood: "A−" },
];

const creators = [
  { name: "Evandro Fernandes", role: "Desenvolvedor de projeto e Front-end", initials: "EF", bio: "Cria experiências digitais claras, acessíveis e funcionais." },
  { name: "Abelardo Guarda-Sol", role: "Desenvolvedor Back-end", initials: "AG", bio: "Constrói soluções robustas e seguras para a plataforma." },
];


/* ------------------------------------------------------------------
   DADOS DA SECÇÃO "A NECESSIDADE"
   Mundo: valores publicados pela OMS (Organização Mundial da Saúde).
   Angola: preencha com dados oficiais (Ministério da Saúde / INSA /
   Instituto Nacional de Sangue). Enquanto `value` for null, o cartão
   mostra "Em validação" — nunca invente números numa página de saúde.
------------------------------------------------------------------- */
const worldFacts = [
  { value: "118,5 milhões", label: "de doações de sangue por ano no mundo", source: "OMS" },
  { value: "≈ 1 em 4", label: "mortes maternas é causada por hemorragia grave", source: "OMS" },
  { value: "1%", label: "da população a doar cobre, em geral, as necessidades básicas de sangue", source: "OMS" },
];

/* ANGOLA — números calculados, não inventados:
   - registeredDonors: troque pelo total real da sua base de dados.
   - ANGOLA_POPULATION: valor aproximado; confirme no INE (Instituto Nacional de Estatística).
   - Meta de doadores = 1% da população (referência da OMS para cobrir necessidades básicas). */
// Censo 2024 (resultados definitivos, INE, divulgados a 20/11/2025)
const ANGOLA_POPULATION = 36_604_681;

// Dados divulgados pelo Instituto Nacional de Sangue (INS) / Ministério da Saúde.
// São os mais recentes que encontrei publicados; atualize quando o INS divulgar novos números.
const angolaOfficial = [
  { value: "22% / 78%", label: "doadores voluntários regulares / doadores familiares", source: "INS, dados provisórios (2018)" },
  { value: "40.782", label: "bolsas de sangue doadas de janeiro a maio", source: "INS (2021)" },
  { value: "290 vs 80", label: "unidades de sangue pedidas por dia em Luanda vs doadas", source: "INS (2019)" },
];

// Angola (país): doações por ano vs meta anual do INS.
// O INS não publica o total de dadores; usamos as doações como aproximação.
// Projeção anual = 40.782 bolsas (jan–mai 2021, INS) ÷ 5 meses × 12.
const angolaDonationsPerYear = Math.round((40_782 / 5) * 12);
const angolaAnnualGoal = 300_000; // meta anual do INS (OMS: dádiva voluntária)
const angolaMissing = Math.max(angolaAnnualGoal - angolaDonationsPerYear, 0);
const goalPercent = Math.min((angolaDonationsPerYear / angolaAnnualGoal) * 100, 100);

// Número da própria aplicação (só para o hero) — troque pelo total real da base de dados.
const registeredDonors = 18420;

const stats = [
  { label: "Doadores registados", value: registeredDonors.toLocaleString("pt-PT") },
  { label: "Instituições verificadas", value: "96" },
  { label: "Doações realizadas", value: "7.480" },
];

// Doações por 1.000 habitantes (OMS) — mostra a desigualdade de acesso ao sangue seguro
const donationGap = [
  { label: "Países de rendimento alto", value: 31.5 },
  { label: "Países de rendimento baixo", value: 5.0 },
];

const currentYear = 2026;

export default function HomePage() {
  return (
    <main className="w-full overflow-x-hidden bg-zinc-950 text-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-zinc-950">
        <div className="absolute right-[-8rem] top-[-8rem] h-[36rem] w-[36rem] rounded-full bg-rose-600/20 blur-3xl" />
        <div className="absolute left-[-6rem] bottom-[-8rem] h-[28rem] w-[28rem] rounded-full bg-fuchsia-600/10 blur-3xl" />

        <div className="relative mx-auto grid min-h-[92vh] max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <span className="inline-flex items-center rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-300">
              SoftVida Angola
            </span>
            <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              O seu sangue salva vidas.
              <span className="mt-3 block text-3xl font-light text-zinc-300 sm:text-4xl lg:text-5xl">
                e a sua ajuda faz diferença.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-300">
              Conectamos doadores, instituições e comunidades para responder rapidamente às necessidades mais urgentes do país.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/auth" className="rounded-xl bg-rose-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-900/30 transition hover:bg-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300">
                Tornar-me doador
              </Link>
              <Link href="#necessidade" className="rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400">
                Porque é urgente
              </Link>
            </div>
            <dl className="mt-12 grid gap-6 sm:grid-cols-3">
              {stats.map((item) => (
                <div key={item.label}>
                  <dd className="text-2xl font-bold text-white">{item.value}</dd>
                  <dt className="mt-1 text-sm text-zinc-400">{item.label}</dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative flex items-center justify-center">
            <BloodTypeRotator />
          </div>
        </div>
      </section>

      {/* A NECESSIDADE */}
      <section id="necessidade" className="scroll-mt-4 border-y border-rose-900/40 bg-gradient-to-b from-rose-950/40 to-zinc-950 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Todos os dias, alguém precisa de sangue e não o encontra a tempo.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-zinc-300">
              O sangue não pode ser fabricado: só existe se alguém o doar. Não há uma contagem mundial oficial das mortes
              causadas especificamente pela falta de sangue, mas a hemorragia grave é uma das principais causas de morte
              evitável, e uma doação disponível a tempo muda o desfecho.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {/* Mundo */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-white">No mundo</h3>
              <ul className="mt-6 space-y-6">
                {worldFacts.map((f) => (
                  <li key={f.label} className="border-l-2 border-rose-500 pl-4">
                    <p className="text-3xl font-black text-white">{f.value}</p>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-300">{f.label}</p>
                    <p className="mt-1 text-xs text-zinc-500">Fonte: {f.source}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Angola */}
            <div className="rounded-2xl border border-rose-500/30 bg-zinc-900/80 p-6 sm:p-8">
              <h3 className="text-xl font-semibold text-white">Em Angola</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Doações de sangue em todo o país face à meta anual do Instituto Nacional de Sangue.
              </p>

              <dl className="mt-6 grid grid-cols-2 gap-6">
                <div className="border-l-2 border-rose-500 pl-4">
                  <dd className="text-3xl font-black text-white">{angolaDonationsPerYear.toLocaleString("pt-PT")}</dd>
                  <dt className="mt-1 text-sm text-zinc-300">doações por ano em Angola (projeção)</dt>
                </div>
                <div className="border-l-2 border-rose-500 pl-4">
                  <dd className="text-3xl font-black text-white">{angolaAnnualGoal.toLocaleString("pt-PT")}</dd>
                  <dt className="mt-1 text-sm text-zinc-300">necessárias por ano (meta do INS)</dt>
                </div>
              </dl>

              <div className="mt-8">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-zinc-200">Meta alcançada</span>
                  <span className="font-semibold text-white">{goalPercent.toLocaleString("pt-PT", { maximumFractionDigits: 1 })}%</span>
                </div>
                <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-zinc-800" role="progressbar" aria-valuenow={Math.round(goalPercent)} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-full bg-rose-500" style={{ width: `${Math.max(goalPercent, 1)}%` }} />
                </div>
                <p className="mt-3 text-sm text-zinc-300">
                  Faltam cerca de <span className="font-semibold text-white">{angolaMissing.toLocaleString("pt-PT")}</span> doações por ano.
                </p>
              </div>

              <ul className="mt-8 space-y-5">
                {angolaOfficial.map((f) => (
                  <li key={f.label} className="border-l-2 border-rose-500 pl-4">
                    <p className="text-2xl font-black text-white">{f.value}</p>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-300">{f.label}</p>
                    <p className="mt-1 text-xs text-zinc-500">Fonte: {f.source}</p>
                  </li>
                ))}
              </ul>

              <p className="mt-6 text-xs leading-relaxed text-zinc-500">
                Projeção própria: 40.782 bolsas doadas de janeiro a maio de 2021 (INS), multiplicadas para 12 meses. O INS não
                publica o total de doadores, por isso usamos as doações como aproximação. Meta anual de 300.000 definida pelo INS.
                Não existe contagem pública oficial de mortes por falta de sangue em Angola.
              </p>
            </div>
          </div>

          {/* Desigualdade */}
          <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 sm:p-8">
            <h3 className="text-xl font-semibold text-white">Quem tem sangue disponível?</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
              Doações de sangue por cada 1.000 habitantes. Onde há menos doadores, há mais famílias à espera.
            </p>
            <div className="mt-6 space-y-5">
              {donationGap.map((row) => (
                <div key={row.label}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-zinc-200">{row.label}</span>
                    <span className="font-semibold text-white">{row.value.toLocaleString("pt-PT")}</span>
                  </div>
                  <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div className="h-full rounded-full bg-rose-500" style={{ width: `${(row.value / 31.5) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-zinc-500">Fonte: OMS, Fact sheet “Blood safety and availability”.</p>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/auth" className="rounded-xl bg-rose-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-900/30 transition hover:bg-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300">
              Quero ser doador
            </Link>
            <Link href="/pedidos" className="text-sm font-semibold text-rose-300 transition hover:text-rose-200">
              Ver pedidos ativos
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="bg-zinc-950 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-300">Categorias</p>
              <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Como podemos ajudar</h2>
            </div>
            <Link href="/pedidos" className="text-sm font-semibold text-rose-300 transition hover:text-rose-200">
              Ver todos os pedidos →
            </Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((item) => (
              <div key={item.title} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 transition hover:border-rose-500/40 hover:bg-zinc-900">
                <div className="text-3xl">{item.icon}</div>
                <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VANTAGENS */}
      <section className="bg-zinc-900 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-300">Vantagens</p>
            <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Porque usar a plataforma</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {benefits.map((item) => (
              <div key={item.title} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                <span className="text-3xl">{item.icon}</span>
                <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="bg-zinc-950 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-300">Como funciona</p>
            <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Faça a diferença em 4 passos</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step) => (
              <div key={step.number} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-600 text-lg font-black text-white">{step.number}</div>
                <h3 className="mt-5 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COBERTURA */}
      <section className="bg-zinc-900 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-300">Cobertura</p>
            <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Presente em todo o país</h2>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {provinces.map((province) => (
              <span key={province} className="rounded-full border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm text-zinc-200">{province}</span>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="bg-zinc-950 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-300">Depoimentos</p>
            <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Histórias reais</h2>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {testimonials.map((item) => (
              <div key={item.name} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                <p className="text-base leading-relaxed text-zinc-200">“{item.quote}”</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-600 text-sm font-bold text-white">{item.blood}</div>
                  <div>
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-sm text-zinc-400">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EQUIPA */}
      <section className="bg-zinc-900 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-300">Quem somos</p>
            <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Uma equipa que quer transformar a solidariedade</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {creators.map((person) => (
              <div key={person.name} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 text-xl font-bold text-white">{person.initials}</div>
                <h3 className="mt-5 text-lg font-semibold text-white">{person.name}</h3>
                <p className="mt-1 text-sm text-rose-300">{person.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{person.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-rose-600 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-white sm:text-5xl">Pronto para salvar a próxima vida?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-rose-100">
            Junte-se à rede de solidariedade e ajude a responder às necessidades mais urgentes do país.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/auth" className="rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-rose-600 shadow-lg shadow-rose-900/20 transition hover:bg-rose-50">Registar-me agora</Link>
            <Link href="/pedidos" className="rounded-xl border border-white/40 bg-rose-500/10 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-rose-500/20">Ver pedidos</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800 bg-zinc-950 py-12">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-600 text-lg font-black text-white">♥</div>
              <span className="text-lg font-semibold text-white">SoftVida Angola</span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-400">
              Ligamos doadores, instituições e comunidades para salvar vidas e fortalecer a solidariedade em Angola.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-300">Plataforma</p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-400">
              <li><Link href="/instituicoes" className="hover:text-white">Instituições</Link></li>
              <li><Link href="/pedidos" className="hover:text-white">Pedidos</Link></li>
              <li><Link href="/ajuda" className="hover:text-white">Ajuda</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-300">Conta</p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-400">
              <li><Link href="/auth" className="hover:text-white">Iniciar sessão</Link></li>
              <li><Link href="/auth" className="hover:text-white">Registar</Link></li>
              <li><Link href="/ajuda" className="hover:text-white">Suporte</Link></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-10 flex max-w-7xl flex-col items-center justify-between gap-3 border-t border-zinc-800 px-4 pt-6 text-sm text-zinc-500 sm:flex-row sm:px-6 lg:px-8">
          <p>© {currentYear} SoftVida. Todos os direitos reservados.</p>
          <p>Feito com ♥ em Angola</p>
        </div>
      </footer>
    </main>
  );
}