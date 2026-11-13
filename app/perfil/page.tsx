"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const provinces = [
  "Bengo","Benguela","Bié","Cabinda","Cuando","Cubango","Cuanza Norte","Cuanza Sul","Cunene","Huambo","Huíla",
  "Icolo e Bengo","Luanda","Lunda Norte","Lunda Sul","Malanje","Moxico","Moxico Leste","Namibe","Uíge","Zaire",
];

const municipalitiesByProvince: Record<string, string[]> = {
  Bengo: ["Ambriz", "Dande", "Nambuangongo", "Pango Aluquém", "Bengo"],
  Benguela: ["Benguela", "Lobito", "Baía Farta", "Caimbambo", "Chongorói"],
  Bié: ["Andulo", "Camacupa", "Catabola", "Chitembo", "Cuemba", "N'harea"],
  Cabinda: ["Belize", "Cabinda", "Cacongo", "Buco-Zau"],
  Cuando: ["Mavinga", "Menongue", "Nancova", "Cuanhama", "Cuchi"],
  Cubango: ["Cuito Cuanavale", "Dirico", "Mucusso", "Naroa", "Rivungo"],
  "Cuanza Norte": ["Ambaca", "Bolongongo", "Cambambe", "Cazengo", "Golungo Alto", "N'dalatando"],
  "Cuanza Sul": ["Amboim", "Cassongue", "Ebo", "Libolo", "Porto Amboim", "Seles"],
  Cunene: ["Cahama", "Cuanhama", "Curoca", "Namacunde", "Ombadja"],
  Huambo: ["Bailundo", "Caála", "Huambo", "Longonjo", "Mungo"],
  Huíla: ["Cacula", "Humpata", "Lubango", "Matala", "Quilengues", "Chibia"],
  "Icolo e Bengo": ["Icolo e Bengo", "Quiçama"],
  Luanda: ["Belas", "Cacuaco", "Cazenga", "Ingombota", "Kilamba Kiaxi", "Maianga", "Rangel", "Samba", "Sambizanga", "Viana"],
  "Lunda Norte": ["Cambulo", "Chitato", "Cuango", "Dondo", "Lubalo", "Lunda Norte"],
  "Lunda Sul": ["Cacolo", "Dala", "Muconda", "Saurimo"],
  Malanje: ["Cacuso", "Calandula", "Kiwaba Nzoji", "Malanje", "Marimba"],
  Moxico: ["Alto Zambeze", "Bundas", "Léua", "Moxico", "Luacano"],
  "Moxico Leste": ["Lagoa", "Moxico Leste", "Songo", "Moxico"],
  Namibe: ["Bibala", "Camucuio", "Moçâmedes", "Tômbwa"],
  Uíge: ["Bungo", "Damba", "Mucaba", "Negage", "Uíge"],
  Zaire: ["Mbanza Congo", "N'zeto", "Soyo", "Cuimba"],
};

const channels = [
  { value: "in_app", label: "Na app" },
  { value: "email", label: "Email" },
  { value: "push", label: "Push" },
  { value: "sms", label: "SMS" },
] as const;

const donationTypes = [
  { value: "sangue", label: "Sangue" },
  { value: "osso", label: "Osso" },
  { value: "pele", label: "Pele" },
  { value: "rim", label: "Rim" },
  { value: "figado", label: "Fígado" },
  { value: "medula_ossea", label: "Medula óssea" },
  { value: "coracao", label: "Coração" },
  { value: "pulmoes", label: "Pulmões" },
  { value: "pancreas", label: "Pâncreas" },
  { value: "cornelas", label: "Córneas" },
] as const;

type Channel = (typeof channels)[number]["value"];
type DonationType = (typeof donationTypes)[number]["value"];

type ProfileForm = {
  nome_completo: string; telefone: string; data_nascimento: string; identificacao_legal: string;
  provincia: string; municipio: string; bairro: string; tipo_sanguineo: string;
  peso_kg: string; altura_cm: string; doencas_cronicas: string; medicacao: string;
  tatuagem_recente: boolean; viagem_recente: boolean; fumador: boolean; consome_alcool: boolean;
  disponivel: boolean; perfil_publico: boolean; partilhar_dados_saude: boolean; ultima_doacao_em: string;
};

type NotificationItem = { id: number; titulo: string; texto: string; canal: Channel; tipo_doacao: DonationType };

const initialForm: ProfileForm = {
  nome_completo: "", telefone: "", data_nascimento: "", identificacao_legal: "",
  provincia: "", municipio: "", bairro: "", tipo_sanguineo: "O+",
  peso_kg: "", altura_cm: "", doencas_cronicas: "nenhuma", medicacao: "nao",
  tatuagem_recente: false, viagem_recente: false, fumador: false, consome_alcool: false,
  disponivel: true, perfil_publico: true, partilhar_dados_saude: false, ultima_doacao_em: "",
};

const inputClass =
  "w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white placeholder:text-zinc-500 outline-none transition focus:border-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500/40 disabled:cursor-not-allowed disabled:opacity-50";

/* ---------- Componentes de apoio ---------- */

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-xl shadow-black/20 sm:p-6">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {hint && <p className="mt-1 text-sm text-zinc-400">{hint}</p>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({ label, hint, wide, children }: { label: string; hint?: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block text-sm text-zinc-300 ${wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

function Switch({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-left transition hover:border-zinc-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
    >
      <span>
        <span className="block text-sm font-medium text-zinc-100">{label}</span>
        {desc && <span className="mt-0.5 block text-xs text-zinc-500">{desc}</span>}
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-rose-600" : "bg-zinc-700"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? "left-[1.375rem]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

/* ---------- Lógica de apoio ---------- */

const formatDate = (d: Date) => d.toLocaleDateString("pt-PT");

function getAge(birth: string) {
  if (!birth) return null;
  const b = new Date(birth);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  if (now < new Date(now.getFullYear(), b.getMonth(), b.getDate())) age--;
  return age;
}

// Indicação informativa. A triagem final é sempre feita pela instituição de saúde.
function getEligibility(f: ProfileForm) {
  const blocking: string[] = [];
  const warnings: string[] = [];
  const age = getAge(f.data_nascimento);
  const peso = Number(f.peso_kg);

  if (age === null || !peso) {
    return { status: "incompleto" as const, blocking, warnings: ["Preencha a data de nascimento e o peso para ver a sua aptidão."] };
  }
  if (age < 18 || age > 65) blocking.push("Idade fora do intervalo habitual (18 a 65 anos).");
  if (peso < 50) blocking.push("Peso abaixo do mínimo habitual (50 kg).");
  if (f.ultima_doacao_em) {
    const next = new Date(f.ultima_doacao_em);
    next.setDate(next.getDate() + 90);
    if (next > new Date()) blocking.push(`Aguarde até ${formatDate(next)} para voltar a doar.`);
  }
  if (!f.disponivel) blocking.push("Marcou-se como indisponível.");
  if (f.tatuagem_recente) warnings.push("Tatuagem recente: normalmente exige um período de espera.");
  if (f.viagem_recente) warnings.push("Viagem recente: a equipa pode pedir informações adicionais.");
  if (f.doencas_cronicas !== "nenhuma" || f.medicacao !== "nao") warnings.push("Condição ou medicação declarada: será avaliada na triagem.");

  const status = blocking.length ? ("nao_apto" as const) : warnings.length ? ("atencao" as const) : ("apto" as const);
  return { status, blocking, warnings };
}

const statusStyle = {
  apto: { label: "Apto para doar", box: "border-emerald-500/40 bg-emerald-500/10", text: "text-emerald-300" },
  atencao: { label: "Apto, com atenção", box: "border-amber-500/40 bg-amber-500/10", text: "text-amber-300" },
  nao_apto: { label: "Neste momento, não apto", box: "border-rose-500/40 bg-rose-500/10", text: "text-rose-300" },
  incompleto: { label: "Perfil incompleto", box: "border-zinc-700 bg-zinc-900", text: "text-zinc-300" },
};

/* ---------- Página ---------- */

export default function PerfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [baseline, setBaseline] = useState<ProfileForm>(initialForm);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [newNotification, setNewNotification] = useState({
    titulo: "", texto: "", canal: "in_app" as Channel, tipo_doacao: "sangue" as DonationType,
  });

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!isMounted) return;
      if (!session) { setLoading(false); return; }

      const currentUser = session.user;
      setUserId(currentUser.id);
      const meta = currentUser.user_metadata ?? {};

      // Monta o formulário completo e só depois atualiza o estado (permite detetar alterações por guardar)
      const next: ProfileForm = {
        ...initialForm,
        nome_completo: meta.nome_completo || "",
        telefone: meta.telefone || "",
        provincia: meta.provincia || "",
        municipio: meta.municipio || "",
        bairro: meta.bairro || "",
      };

      const { data: perfilData } = await supabase.from("perfis").select("nome_completo, telefone").eq("id", currentUser.id).maybeSingle();
      if (perfilData) {
        next.nome_completo = perfilData.nome_completo || next.nome_completo;
        next.telefone = perfilData.telefone || next.telefone;
      }

      const { data: d } = await supabase.from("doadores").select("*").eq("utilizador_id", currentUser.id).maybeSingle();
      if (d) {
        const day = (v: string | null) => (v ? new Date(v).toISOString().slice(0, 10) : "");
        Object.assign(next, {
          tipo_sanguineo: d.tipo_sanguineo || next.tipo_sanguineo,
          data_nascimento: day(d.data_nascimento),
          identificacao_legal: d.identificacao_legal || "",
          peso_kg: d.peso_kg ? String(d.peso_kg) : "",
          altura_cm: d.altura_cm ? String(d.altura_cm) : "",
          doencas_cronicas: d.doencas_cronicas || next.doencas_cronicas,
          medicacao: d.medicacao || next.medicacao,
          tatuagem_recente: Boolean(d.tatuagem_recente),
          viagem_recente: Boolean(d.viagem_recente),
          fumador: Boolean(d.fumador),
          consome_alcool: Boolean(d.consome_alcool),
          disponivel: Boolean(d.disponivel),
          perfil_publico: Boolean(d.perfil_publico),
          partilhar_dados_saude: Boolean(d.partilhar_dados_saude),
          ultima_doacao_em: day(d.ultima_doacao_em),
          bairro: d.bairro || next.bairro,
        });
      }

      if (!isMounted) return;
      setForm(next);
      setBaseline(next);
      setLoading(false);
    };

    loadProfile();
    return () => { isMounted = false; };
  }, []);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [form, baseline]);

  // Avisa antes de sair com alterações por guardar
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Mensagens desaparecem sozinhas
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(t);
  }, [message]);

  const municipalityOptions = useMemo(() => (form.provincia ? municipalitiesByProvince[form.provincia] ?? [] : []), [form.provincia]);

  const completeness = useMemo(() => {
    const filled = [form.nome_completo, form.telefone, form.data_nascimento, form.identificacao_legal, form.provincia, form.municipio, form.peso_kg, form.altura_cm]
      .filter((v) => v.trim() !== "").length;
    return Math.round((filled / 8) * 100);
  }, [form]);

  const eligibility = useMemo(() => getEligibility(form), [form]);
  const style = statusStyle[eligibility.status];

  const handleChange = <K extends keyof ProfileForm>(field: K, value: ProfileForm[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSaveProfile = async () => {
    if (!userId) { setMessage({ type: "error", text: "Precisa de iniciar sessão para guardar o perfil." }); return; }
    if (!form.nome_completo.trim()) { setMessage({ type: "error", text: "Indique o seu nome completo antes de guardar." }); return; }

    setSaving(true);
    setMessage(null);

    try {
      const perfisPayload = { id: userId, papel: "doador", nome_completo: form.nome_completo, telefone: form.telefone || null };

      const doadorPayload = {
        utilizador_id: userId,
        tipo_sanguineo: form.tipo_sanguineo,
        data_nascimento: form.data_nascimento ? new Date(form.data_nascimento).toISOString() : null,
        identificacao_legal: form.identificacao_legal || null,
        peso_kg: form.peso_kg ? Number(form.peso_kg) : null,
        altura_cm: form.altura_cm ? Number(form.altura_cm) : null,
        doencas_cronicas: form.doencas_cronicas,
        medicacao: form.medicacao,
        tatuagem_recente: form.tatuagem_recente,
        viagem_recente: form.viagem_recente,
        fumador: form.fumador,
        consome_alcool: form.consome_alcool,
        disponivel: form.disponivel,
        perfil_publico: form.perfil_publico,
        partilhar_dados_saude: form.partilhar_dados_saude,
        ultima_doacao_em: form.ultima_doacao_em ? new Date(form.ultima_doacao_em).toISOString() : null,
        bairro: form.bairro || null,
      };

      const { error: perfilError } = await supabase.from("perfis").upsert(perfisPayload, { onConflict: "id" });
      if (perfilError) throw perfilError;
      const { error: doadorError } = await supabase.from("doadores").upsert(doadorPayload, { onConflict: "utilizador_id" });
      if (doadorError) throw doadorError;

      setBaseline(form);
      setMessage({ type: "success", text: "Perfil guardado com sucesso." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Não foi possível guardar o perfil." });
    } finally {
      setSaving(false);
    }
  };

  const handleAddNotification = () => {
    if (!newNotification.titulo.trim() || !newNotification.texto.trim()) {
      setMessage({ type: "error", text: "Preencha o título e a mensagem da notificação." });
      return;
    }
    setNotifications((prev) => [{ id: Date.now(), ...newNotification }, ...prev]);
    setNewNotification({ titulo: "", texto: "", canal: "in_app", tipo_doacao: "sangue" });
    setMessage({ type: "success", text: "Notificação criada." });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse space-y-6 px-4 py-10" aria-busy="true" aria-label="A carregar o perfil">
        <div className="h-10 w-64 rounded-xl bg-zinc-900" />
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="h-[32rem] rounded-3xl bg-zinc-900" />
          <div className="h-80 rounded-3xl bg-zinc-900" />
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-10 text-center shadow-2xl shadow-black/30">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-300">SoftVida</p>
          <h1 className="mt-4 text-3xl font-bold text-white">Precisa de iniciar sessão</h1>
          <p className="mt-3 text-zinc-400">Faça login para completar o seu perfil e gerir as notificações.</p>
          <Link href="/auth" className="mt-6 inline-flex rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-500">
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-10 sm:px-6 lg:px-8">
      {/* Cabeçalho */}
      <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-300">Perfil</p>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Dados do doador</h1>
          <p className="mt-2 text-sm text-zinc-400">Quanto mais completo, mais precisos os alertas que recebe.</p>
        </div>
        <div className="w-full md:w-72">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-zinc-300">Perfil completo</span>
            <span className="font-semibold text-white">{completeness}%</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-zinc-800" role="progressbar" aria-valuenow={completeness} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-rose-500 transition-all duration-500" style={{ width: `${completeness}%` }} />
          </div>
        </div>
      </header>

      {message && (
        <div
          role="status"
          className={`fixed right-4 top-4 z-50 max-w-sm rounded-xl border px-4 py-3 text-sm shadow-lg ${
            message.type === "success"
              ? "border-emerald-500/40 bg-emerald-950 text-emerald-200"
              : "border-rose-500/40 bg-rose-950 text-rose-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Formulário */}
        <div className="space-y-6">
          <Section title="Identificação">
            <Field label="Nome completo *" wide>
              <input value={form.nome_completo} onChange={(e) => handleChange("nome_completo", e.target.value)} placeholder="Ex: Ana Mário" autoComplete="name" className={inputClass} />
            </Field>
            <Field label="Telefone">
              <input type="tel" value={form.telefone} onChange={(e) => handleChange("telefone", e.target.value)} placeholder="+244 923 000 000" autoComplete="tel" className={inputClass} />
            </Field>
            <Field label="Data de nascimento">
              <input type="date" value={form.data_nascimento} onChange={(e) => handleChange("data_nascimento", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Identificação legal" hint="BI, passaporte ou NIF. Não é mostrada a outros utilizadores." wide>
              <input value={form.identificacao_legal} onChange={(e) => handleChange("identificacao_legal", e.target.value)} placeholder="BI / Passaporte / NIF" className={inputClass} />
            </Field>
          </Section>

          <Section title="Localização" hint="Usamos a sua zona para enviar pedidos de doação perto de si.">
            <Field label="Província">
              <select
                value={form.provincia}
                onChange={(e) => { handleChange("provincia", e.target.value); handleChange("municipio", ""); }}
                className={inputClass}
              >
                <option value="">Selecione</option>
                {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Município">
              <select value={form.municipio} onChange={(e) => handleChange("municipio", e.target.value)} disabled={!form.provincia} className={inputClass}>
                <option value="">{form.provincia ? "Selecione" : "Escolha primeiro a província"}</option>
                {municipalityOptions.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Bairro (opcional)" wide>
              <input value={form.bairro} onChange={(e) => handleChange("bairro", e.target.value)} placeholder="Ex: Bairro Operário" className={inputClass} />
            </Field>
          </Section>

          <Section title="Dados de saúde">
            <Field label="Tipo sanguíneo">
              <select value={form.tipo_sanguineo} onChange={(e) => handleChange("tipo_sanguineo", e.target.value)} className={inputClass}>
                {bloodTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Última doação" hint="Deixe vazio se nunca doou.">
              <input type="date" max={new Date().toISOString().slice(0, 10)} value={form.ultima_doacao_em} onChange={(e) => handleChange("ultima_doacao_em", e.target.value)} className={inputClass} />
            </Field>
            <Field label="Peso (kg)">
              <input type="number" inputMode="decimal" min={40} step="0.1" value={form.peso_kg} onChange={(e) => handleChange("peso_kg", e.target.value)} placeholder="60" className={inputClass} />
            </Field>
            <Field label="Altura (cm)">
              <input type="number" inputMode="numeric" min={140} step="1" value={form.altura_cm} onChange={(e) => handleChange("altura_cm", e.target.value)} placeholder="170" className={inputClass} />
            </Field>
            <Field label="Doenças crónicas">
              <select value={form.doencas_cronicas} onChange={(e) => handleChange("doencas_cronicas", e.target.value)} className={inputClass}>
                <option value="nenhuma">Nenhuma</option>
                <option value="hipertensao">Hipertensão</option>
                <option value="diabetes">Diabetes</option>
                <option value="anemia_falciforme">Anemia falciforme</option>
                <option value="outra">Outra</option>
              </select>
            </Field>
            <Field label="Medicação">
              <select value={form.medicacao} onChange={(e) => handleChange("medicacao", e.target.value)} className={inputClass}>
                <option value="nao">Não</option>
                <option value="anticoagulantes">Anticoagulantes</option>
                <option value="antibioticos">Antibióticos</option>
                <option value="outro">Outro</option>
              </select>
            </Field>
          </Section>

          <Section title="Histórico e hábitos" hint="Ajuda a equipa a avaliar se pode doar com segurança.">
            <Switch label="Tatuagem recente" checked={form.tatuagem_recente} onChange={(v) => handleChange("tatuagem_recente", v)} />
            <Switch label="Viagem recente" checked={form.viagem_recente} onChange={(v) => handleChange("viagem_recente", v)} />
            <Switch label="Fumador" checked={form.fumador} onChange={(v) => handleChange("fumador", v)} />
            <Switch label="Consome álcool" checked={form.consome_alcool} onChange={(v) => handleChange("consome_alcool", v)} />
          </Section>

          <Section title="Disponibilidade e privacidade">
            <Switch label="Disponível para doar" desc="Se desligar, deixa de receber alertas." checked={form.disponivel} onChange={(v) => handleChange("disponivel", v)} />
            <Switch label="Perfil público" desc="Instituições verificadas podem encontrá-lo." checked={form.perfil_publico} onChange={(v) => handleChange("perfil_publico", v)} />
            <div className="sm:col-span-2">
              <Switch label="Partilhar dados de saúde" desc="Permite que as instituições vejam peso, medicação e histórico." checked={form.partilhar_dados_saude} onChange={(v) => handleChange("partilhar_dados_saude", v)} />
            </div>
          </Section>
        </div>

        {/* Lateral */}
        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <section className={`rounded-3xl border p-5 sm:p-6 ${style.box}`} aria-live="polite">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Aptidão para doar</p>
            <h2 className={`mt-2 text-xl font-bold ${style.text}`}>{style.label}</h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-300">
              {eligibility.blocking.map((r) => <li key={r}>• {r}</li>)}
              {eligibility.warnings.map((r) => <li key={r}>• {r}</li>)}
              {eligibility.status === "apto" && <li>Não há nada que o impeça de doar. Mantenha o perfil atualizado.</li>}
            </ul>
            <p className="mt-4 text-xs text-zinc-500">Indicação informativa. A decisão final é sempre da equipa de saúde na triagem.</p>
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-xl shadow-black/20 sm:p-6">
            <h2 className="text-lg font-semibold text-white">Criar lembrete</h2>
            <div className="mt-4 space-y-4">
              <Field label="Título">
                <input value={newNotification.titulo} onChange={(e) => setNewNotification((p) => ({ ...p, titulo: e.target.value }))} placeholder="Ex: Voltar a doar" className={inputClass} />
              </Field>
              <Field label="Mensagem">
                <textarea rows={3} value={newNotification.texto} onChange={(e) => setNewNotification((p) => ({ ...p, texto: e.target.value }))} placeholder="Descreva o aviso que pretende receber." className={inputClass} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Canal">
                  <select value={newNotification.canal} onChange={(e) => setNewNotification((p) => ({ ...p, canal: e.target.value as Channel }))} className={inputClass}>
                    {channels.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </Field>
                <Field label="Tipo de doação">
                  <select value={newNotification.tipo_doacao} onChange={(e) => setNewNotification((p) => ({ ...p, tipo_doacao: e.target.value as DonationType }))} className={inputClass}>
                    {donationTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
              </div>
              <button type="button" onClick={handleAddNotification} className="w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300">
                Criar lembrete
              </button>
            </div>

            <div className="mt-6 border-t border-zinc-800 pt-5">
              <h3 className="text-sm font-semibold text-white">Os seus lembretes</h3>
              <p className="mt-1 text-xs text-zinc-500">Ficam guardados apenas nesta sessão.</p>
              <div className="mt-3 space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-sm text-zinc-400">Ainda não criou nenhum lembrete.</p>
                ) : (
                  notifications.map((item) => {
                    const donationLabel = donationTypes.find((t) => t.value === item.tipo_doacao)?.label ?? "Doação";
                    const channelLabel = channels.find((c) => c.value === item.canal)?.label ?? item.canal;
                    return (
                      <div key={item.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-semibold text-white">{item.titulo}</p>
                          <button type="button" onClick={() => setNotifications((p) => p.filter((n) => n.id !== item.id))} aria-label={`Remover lembrete ${item.titulo}`} className="text-zinc-500 transition hover:text-rose-300">✕</button>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-zinc-300">{item.texto}</p>
                        <p className="mt-2 text-xs text-zinc-500">{donationLabel} · {channelLabel}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* Barra de guardar: aparece quando há alterações */}
      <div className={`fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur transition-transform duration-300 ${dirty ? "translate-y-0" : "translate-y-full"}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <p className="text-sm text-zinc-300">Tem alterações por guardar.</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setForm(baseline)} disabled={saving} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 disabled:opacity-50">
              Descartar
            </button>
            <button type="button" onClick={handleSaveProfile} disabled={saving} className="rounded-xl bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? "A guardar..." : "Guardar perfil"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}