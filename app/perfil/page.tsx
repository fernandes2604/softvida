"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { loadDonorProfile, saveDonorProfile } from "@/app/actions";
import { supabase } from "@/lib/supabase";

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const niveis = [
  { value: "informativo", label: "Informativo", desc: "Sem pressa. Válido 72 h.", active: "border-sky-500 bg-sky-500/15 text-sky-200" },
  { value: "atencao", label: "Atenção", desc: "Válido 48 h.", active: "border-emerald-500 bg-emerald-500/15 text-emerald-200" },
  { value: "urgente", label: "Urgente", desc: "Válido 24 h. Avisa por push.", active: "border-amber-500 bg-amber-500/15 text-amber-200" },
  { value: "critico", label: "Crítico", desc: "Risco de vida. Válido 12 h. Push e SMS.", active: "border-rose-500 bg-rose-500/20 text-rose-100" },
] as const;

type Nivel = (typeof niveis)[number]["value"];
type ProvinceRow = { id: number; nome: string };
type MunicipalityRow = { id: number; provincia_id: number; nome: string };
type CategoryRow = { id: number; slug: string; nome: string };
type Institution = { id: string; nome: string; estado: string; endereco: string | null; lat: number | null; lng: number | null; provincia_id: number | null; municipio_id: number | null };

type ProfileForm = {
  nome_completo: string; telefone: string; data_nascimento: string; sexo: "" | "masculino" | "feminino";
  provincia: string; municipio: string; bairro: string; lat: number | null; lng: number | null;
  distancia_maxima_km: number; nivel_minimo_alerta: Nivel;
  tipo_sanguineo: string; peso_kg: string; altura_cm: string; doencas_cronicas: string; medicacao: string;
  tatuagem_recente: boolean; viagem_recente: boolean; fumador: boolean; consome_alcool: boolean;
  disponivel: boolean; perfil_publico: boolean; partilhar_dados_saude: boolean; ultima_doacao_em: string;
};

type RequestItem = { id: string; titulo: string; nivel: Nivel; categoria: string; tipo_sanguineo: string | null; codigo: string | null };

const initialRequest = { titulo: "", corpo: "", categoria_id: "", tipo_sanguineo: "O+", nivel: "urgente" as Nivel, doadores_necessarios: "1" };

const initialForm: ProfileForm = {
  nome_completo: "", telefone: "", data_nascimento: "", sexo: "",
  provincia: "", municipio: "", bairro: "", lat: null, lng: null,
  distancia_maxima_km: 10, nivel_minimo_alerta: "atencao",
  tipo_sanguineo: "O+", peso_kg: "", altura_cm: "", doencas_cronicas: "nenhuma", medicacao: "nao",
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

// Espelha a função calcular_aptidao() da base de dados. Quem tem algum motivo NÃO recebe alertas de sangue.
function getEligibility(f: ProfileForm) {
  const blocking: string[] = [];
  const warnings: string[] = [];
  const age = getAge(f.data_nascimento);
  const peso = Number(f.peso_kg);

  if (f.lat === null || f.lng === null) warnings.push("Guarde a sua localização para receber pedidos perto de si.");
  if (age === null || !peso) {
    return { status: "incompleto" as const, blocking, warnings: ["Preencha a data de nascimento e o peso para ver a sua aptidão.", ...warnings] };
  }
  if (age < 18) blocking.push("É necessário ter pelo menos 18 anos.");
  if (peso < 50) blocking.push("Peso inferior a 50 kg.");
  if (f.ultima_doacao_em) {
    const dias = f.sexo === "feminino" ? 120 : 90;
    const next = new Date(f.ultima_doacao_em);
    next.setDate(next.getDate() + dias);
    if (next > new Date()) blocking.push(`Última doação há menos de ${dias} dias. Próxima doação a partir de ${formatDate(next)}.`);
  }
  if (f.doencas_cronicas !== "nenhuma") blocking.push("Doença crónica declarada (requer avaliação clínica).");
  if (f.medicacao !== "nao") blocking.push("Medicação em curso (requer avaliação clínica).");
  if (f.tatuagem_recente) blocking.push("Tatuagem recente (aguardar cerca de 4 meses).");
  if (f.viagem_recente) blocking.push("Viagem recente (requer avaliação clínica).");

  return { status: blocking.length ? ("nao_apto" as const) : ("apto" as const), blocking, warnings };
}

const statusStyle = {
  apto: { label: "Apto para doar sangue", box: "border-emerald-500/40 bg-emerald-500/10", text: "text-emerald-300" },
  nao_apto: { label: "Neste momento, não apto", box: "border-rose-500/40 bg-rose-500/10", text: "text-rose-300" },
  incompleto: { label: "Perfil incompleto", box: "border-zinc-700 bg-zinc-900", text: "text-zinc-300" },
};

/* ---------- Página ---------- */

export default function PerfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [papel, setPapel] = useState<"doador" | "instituicao" | "admin">("doador");
  const [provinceRows, setProvinceRows] = useState<ProvinceRow[]>([]);
  const [municipalityRows, setMunicipalityRows] = useState<MunicipalityRow[]>([]);
  const [categoryRows, setCategoryRows] = useState<CategoryRow[]>([]);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [locating, setLocating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [baseline, setBaseline] = useState<ProfileForm>(initialForm);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [newRequest, setNewRequest] = useState(initialRequest);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!isMounted) return;
      if (!session) { setLoading(false); return; }
      const uid = session.user.id;
      setUserId(uid);

      const [prov, mun, cat, perfilDb] = await Promise.all([
        supabase.from("provincias").select("id, nome").order("nome"),
        supabase.from("municipios").select("id, provincia_id, nome").order("nome"),
        supabase.from("categorias").select("id, slug, nome").order("id"),
        supabase.from("perfis").select("nome_completo, telefone, papel").eq("id", uid).maybeSingle(),
      ]);
      const provs = (prov.data ?? []) as ProvinceRow[];
      const muns = (mun.data ?? []) as MunicipalityRow[];
      const cats = (cat.data ?? []) as CategoryRow[];
      if (!isMounted) return;
      setProvinceRows(provs); setMunicipalityRows(muns); setCategoryRows(cats);

      const role = (perfilDb.data?.papel ?? "doador") as "doador" | "instituicao" | "admin";
      setPapel(role);

      if (role === "instituicao") {
        const { data: inst } = await supabase
          .from("instituicoes")
          .select("id, nome, estado, endereco, lat, lng, provincia_id, municipio_id")
          .eq("dono_id", uid).order("criado_em").limit(1).maybeSingle();
        if (!isMounted) return;
        setInstitution((inst as Institution) ?? null);
        const sangue = cats.find((c) => c.slug === "sangue");
        if (sangue) setNewRequest((p) => ({ ...p, categoria_id: String(sangue.id) }));
        setLoading(false);
        return;
      }

      const { perfil, doador } = await loadDonorProfile(uid);
      const next: ProfileForm = { ...initialForm, nome_completo: perfil?.nome_completo ?? "", telefone: perfil?.telefone ?? "" };

      if (doador) {
        const day = (v: string | null) => (v ? String(v).slice(0, 10) : "");
        Object.assign(next, {
          tipo_sanguineo: doador.tipo_sanguineo || next.tipo_sanguineo,
          sexo: doador.sexo ?? "",
          data_nascimento: day(doador.data_nascimento),
          provincia: provs.find((x) => x.id === doador.provincia_id)?.nome ?? "",
          municipio: muns.find((x) => x.id === doador.municipio_id)?.nome ?? "",
          bairro: doador.bairro ?? "",
          lat: doador.lat ?? null,
          lng: doador.lng ?? null,
          distancia_maxima_km: Number(doador.distancia_maxima_km ?? 10),
          nivel_minimo_alerta: doador.nivel_minimo_alerta ?? "atencao",
          peso_kg: doador.peso_kg ? String(doador.peso_kg) : "",
          altura_cm: doador.altura_cm ? String(doador.altura_cm) : "",
          doencas_cronicas: doador.doencas_cronicas || next.doencas_cronicas,
          medicacao: doador.medicacao || next.medicacao,
          tatuagem_recente: Boolean(doador.tatuagem_recente),
          viagem_recente: Boolean(doador.viagem_recente),
          fumador: Boolean(doador.fumador),
          consome_alcool: Boolean(doador.consome_alcool),
          disponivel: Boolean(doador.disponivel),
          perfil_publico: Boolean(doador.perfil_publico),
          partilhar_dados_saude: Boolean(doador.partilhar_dados_saude),
          ultima_doacao_em: day(doador.ultima_doacao_em),
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

  const municipalityOptions = useMemo(() => {
    const provId = provinceRows.find((p) => p.nome === form.provincia)?.id;
    return provId ? municipalityRows.filter((m) => m.provincia_id === provId).map((m) => m.nome) : [];
  }, [form.provincia, provinceRows, municipalityRows]);

  const completeness = useMemo(() => {
    const filled = [form.nome_completo, form.telefone, form.data_nascimento, form.sexo, form.provincia, form.lat !== null ? "ok" : "", form.peso_kg, form.altura_cm]
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

    const telefone = form.telefone.replace(/[\s-]/g, "");
    if (telefone && !/^\+[1-9][0-9]{7,14}$/.test(telefone)) {
      setMessage({ type: "error", text: "Use o formato internacional no telefone, por exemplo +244923000000." }); return;
    }
    const age = getAge(form.data_nascimento);
    if (age !== null && age < 18) { setMessage({ type: "error", text: "É necessário ter pelo menos 18 anos para ser doador." }); return; }
    const peso = form.peso_kg ? Number(form.peso_kg) : null;
    const altura = form.altura_cm ? Number(form.altura_cm) : null;
    if (peso !== null && (peso < 40 || peso > 200)) { setMessage({ type: "error", text: "O peso deve estar entre 40 e 200 kg." }); return; }
    if (altura !== null && (altura < 140 || altura > 220)) { setMessage({ type: "error", text: "A altura deve estar entre 140 e 220 cm." }); return; }

    setSaving(true);
    setMessage(null);

    try {
      const provId = provinceRows.find((p) => p.nome === form.provincia)?.id ?? null;
      const munId = municipalityRows.find((m) => m.nome === form.municipio && m.provincia_id === provId)?.id ?? null;

      const result = await saveDonorProfile({
        userId,
        nome_completo: form.nome_completo,
        telefone: telefone || null,
        tipo_sanguineo: form.tipo_sanguineo,
        data_nascimento: form.data_nascimento || null,
        identificacao_legal: null,
        peso_kg: peso,
        altura_cm: altura,
        doencas_cronicas: form.doencas_cronicas,
        medicacao: form.medicacao,
        tatuagem_recente: form.tatuagem_recente,
        viagem_recente: form.viagem_recente,
        fumador: form.fumador,
        consome_alcool: form.consome_alcool,
        disponivel: form.disponivel,
        perfil_publico: form.perfil_publico,
        partilhar_dados_saude: form.partilhar_dados_saude,
        ultima_doacao_em: form.ultima_doacao_em || null,
        bairro: form.bairro.trim() || null,
      });

      if (!result.ok) throw new Error("Falha ao guardar o perfil.");

      setForm((f) => ({ ...f, telefone }));
      setBaseline({ ...form, telefone });
      setMessage({ type: "success", text: "Perfil guardado com sucesso." });
    } catch (error) {
      const text = error instanceof Error ? error.message : (error as { message?: string })?.message ?? "Não foi possível guardar o perfil.";
      setMessage({ type: "error", text: text.includes("perfis_telefone_uidx") ? "Este telefone já está associado a outra conta." : text });
    } finally {
      setSaving(false);
    }
  };

  const handleLocate = () => {
    if (!navigator.geolocation) { setMessage({ type: "error", text: "O seu dispositivo não suporta localização." }); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, lat: Number(pos.coords.latitude.toFixed(5)), lng: Number(pos.coords.longitude.toFixed(5)) }));
        setLocating(false);
      },
      () => { setLocating(false); setMessage({ type: "error", text: "Não foi possível obter a localização. Verifique a permissão do navegador." }); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  /* ----- Instituição: pedir doação (cria um alerta; os triggers da base de dados avisam os doadores elegíveis) ----- */
  const selectedCategory = categoryRows.find((c) => String(c.id) === newRequest.categoria_id);
  const isBlood = selectedCategory?.slug === "sangue";
  const institutionProblem = !institution
    ? "Ainda não tem uma instituição registada."
    : institution.estado !== "verificada"
    ? "A sua instituição ainda não foi verificada. Só instituições verificadas podem pedir doações."
    : institution.lat === null || institution.lng === null
    ? "Defina a localização da instituição para poder pedir doações."
    : null;
  const institutionPlace = institution
    ? [institution.endereco, municipalityRows.find((m) => m.id === institution.municipio_id)?.nome, provinceRows.find((p) => p.id === institution.provincia_id)?.nome].filter(Boolean).join(", ")
    : "";

  const handleCreateRequest = async () => {
    const r = newRequest;
    if (!institution || institutionProblem) return;
    if (!r.titulo.trim()) { setMessage({ type: "error", text: "Indique o título do pedido." }); return; }
    const needed = Number(r.doadores_necessarios);
    if (!Number.isInteger(needed) || needed < 1) { setMessage({ type: "error", text: "Indique quantos doadores são necessários (mínimo 1)." }); return; }

    setPublishing(true);
    try {
      const { data, error } = await supabase
        .from("alertas")
        .insert({
          instituicao_id: institution.id,
          categoria_id: r.categoria_id ? Number(r.categoria_id) : null,
          tipo_sanguineo_necessario: isBlood ? r.tipo_sanguineo : null,
          nivel: r.nivel,
          titulo: r.titulo.trim(),
          corpo: r.corpo.trim() || null,
          doadores_necessarios: needed,
        })
        .select("id, codigo_curto")
        .single();
      if (error) throw error;

      setRequests((prev) => [{ id: data.id, titulo: r.titulo.trim(), nivel: r.nivel, categoria: selectedCategory?.nome ?? "", tipo_sanguineo: isBlood ? r.tipo_sanguineo : null, codigo: data.codigo_curto }, ...prev]);
      setNewRequest({ ...initialRequest, categoria_id: r.categoria_id });
      setMessage({ type: "success", text: "Pedido publicado. Os doadores elegíveis perto de si vão ser avisados." });
    } catch (error) {
      setMessage({ type: "error", text: (error as { message?: string })?.message ?? "Não foi possível publicar o pedido." });
    } finally {
      setPublishing(false);
    }
  };

  const toast = message && (
    <div
      role="status"
      className={`fixed right-4 top-4 z-50 max-w-sm rounded-xl border px-4 py-3 text-sm shadow-lg ${
        message.type === "success" ? "border-emerald-500/40 bg-emerald-950 text-emerald-200" : "border-rose-500/40 bg-rose-950 text-rose-200"
      }`}
    >
      {message.text}
    </div>
  );

  const requestSection = (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-xl shadow-black/20 sm:p-6">
      <h2 className="text-lg font-semibold text-white">Pedir doação</h2>
      <p className="mt-1 text-sm text-zinc-400">Os doadores elegíveis perto da instituição são avisados automaticamente.</p>

      {institutionProblem && <p className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">{institutionProblem}</p>}

      {institution && (
        <p className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
          <span className="font-semibold text-white">Localização do pedido:</span> {institution.nome}{institutionPlace ? `, ${institutionPlace}` : ""}
        </p>
      )}

      <div className="mt-5 space-y-4">
        <Field label="Título *">
          <input value={newRequest.titulo} onChange={(e) => setNewRequest((p) => ({ ...p, titulo: e.target.value }))} placeholder="Ex: Precisamos de sangue para uma cirurgia" className={inputClass} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="O que precisa">
            <select value={newRequest.categoria_id} onChange={(e) => setNewRequest((p) => ({ ...p, categoria_id: e.target.value }))} className={inputClass}>
              {categoryRows.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </Field>
          {isBlood ? (
            <Field label="Tipo sanguíneo necessário *">
              <select value={newRequest.tipo_sanguineo} onChange={(e) => setNewRequest((p) => ({ ...p, tipo_sanguineo: e.target.value }))} className={inputClass}>
                {bloodTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          ) : (
            <Field label="Doadores necessários *">
              <input type="number" min={1} value={newRequest.doadores_necessarios} onChange={(e) => setNewRequest((p) => ({ ...p, doadores_necessarios: e.target.value }))} className={inputClass} />
            </Field>
          )}
        </div>

        {isBlood && (
          <Field label="Doadores necessários *" hint="O pedido fecha sozinho quando houver aceites suficientes.">
            <input type="number" min={1} value={newRequest.doadores_necessarios} onChange={(e) => setNewRequest((p) => ({ ...p, doadores_necessarios: e.target.value }))} className={inputClass} />
          </Field>
        )}

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-zinc-300">Urgência *</legend>
          <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
            {niveis.map((n) => {
              const selected = newRequest.nivel === n.value;
              return (
                <button
                  key={n.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setNewRequest((p) => ({ ...p, nivel: n.value }))}
                  className={`rounded-xl border px-3 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 ${selected ? n.active : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500"}`}
                >
                  <span className="block text-sm font-semibold">{n.label}</span>
                  <span className="block text-xs opacity-80">{n.desc}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <Field label="Detalhes (opcional)">
          <textarea rows={3} value={newRequest.corpo} onChange={(e) => setNewRequest((p) => ({ ...p, corpo: e.target.value }))} placeholder="Horário, a quem se dirigir, contacto..." className={inputClass} />
        </Field>

        <button type="button" onClick={handleCreateRequest} disabled={publishing || Boolean(institutionProblem)} className="w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300">
          {publishing ? "A publicar..." : "Publicar pedido e alertar"}
        </button>
      </div>

      <div className="mt-6 border-t border-zinc-800 pt-5">
        <h3 className="text-sm font-semibold text-white">Pedidos publicados nesta sessão</h3>
        <div className="mt-3 space-y-3">
          {requests.length === 0 ? (
            <p className="text-sm text-zinc-400">Ainda não publicou nenhum pedido.</p>
          ) : (
            requests.map((item) => {
              const n = niveis.find((x) => x.value === item.nivel) ?? niveis[0];
              return (
                <div key={item.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-white">{item.titulo}</p>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${n.active}`}>{n.label}</span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-400">{item.categoria}{item.tipo_sanguineo ? ` · ${item.tipo_sanguineo}` : ""}{item.codigo ? ` · código SMS ${item.codigo}` : ""}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );

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

  if (papel === "instituicao") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <header className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-300">Instituição</p>
          <h1 className="mt-2 text-3xl font-bold text-white">{institution?.nome ?? "Painel da instituição"}</h1>
        </header>
        {toast}
        {requestSection}
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

      {toast}

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
            <Field label="Sexo" hint="Define o intervalo entre doações (90 dias homens, 120 dias mulheres).">
              <select value={form.sexo} onChange={(e) => handleChange("sexo", e.target.value as ProfileForm["sexo"])} className={inputClass}>
                <option value="">Selecione</option>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
              </select>
            </Field>
          </Section>

          <Section title="Localização e alertas" hint="Sem localização guardada, não recebe pedidos perto de si.">
            <Field label="Província">
              <select
                value={form.provincia}
                onChange={(e) => { handleChange("provincia", e.target.value); handleChange("municipio", ""); }}
                className={inputClass}
              >
                <option value="">Selecione</option>
                {provinceRows.map((p) => <option key={p.id} value={p.nome}>{p.nome}</option>)}
              </select>
            </Field>
            <Field label="Município">
              <select value={form.municipio} onChange={(e) => handleChange("municipio", e.target.value)} disabled={!form.provincia || municipalityOptions.length === 0} className={inputClass}>
                <option value="">{!form.provincia ? "Escolha primeiro a província" : municipalityOptions.length ? "Selecione" : "Sem municípios registados"}</option>
                {municipalityOptions.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Bairro (opcional)" wide>
              <input value={form.bairro} onChange={(e) => handleChange("bairro", e.target.value)} placeholder="Ex: Bairro Operário" className={inputClass} />
            </Field>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 sm:col-span-2">
              <div>
                <p className="text-sm font-medium text-zinc-100">{form.lat !== null ? "Localização guardada" : "Localização não definida"}</p>
                <p className="mt-0.5 text-xs text-zinc-500">As instituições veem apenas a distância aproximada, não o ponto exato.</p>
              </div>
              <button type="button" onClick={handleLocate} disabled={locating} className="rounded-xl border border-rose-500/50 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/10 disabled:opacity-60">
                {locating ? "A localizar..." : form.lat !== null ? "Atualizar localização" : "Usar a minha localização"}
              </button>
            </div>

            <Field label={`Distância máxima: ${form.distancia_maxima_km} km`} hint="Em alertas urgentes ou críticos podemos avisá-lo além deste raio." wide>
              <input type="range" min={1} max={100} value={form.distancia_maxima_km} onChange={(e) => handleChange("distancia_maxima_km", Number(e.target.value))} className="w-full accent-rose-500" />
            </Field>
            <Field label="Receber alertas a partir do nível" wide>
              <select value={form.nivel_minimo_alerta} onChange={(e) => handleChange("nivel_minimo_alerta", e.target.value as Nivel)} className={inputClass}>
                {niveis.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
              </select>
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
            <h2 className="text-lg font-semibold text-white">Alertas de doação</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Os pedidos são emitidos por instituições verificadas. Quando houver um perto de si e compatível com o seu perfil, recebe um alerta na app.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-zinc-300">
              <li>{form.lat !== null ? "✓" : "•"} Localização guardada</li>
              <li>{form.disponivel ? "✓" : "•"} Disponível para doar</li>
              <li>{eligibility.status === "apto" ? "✓" : "•"} Apto para doar sangue</li>
            </ul>
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