"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const tabs = [
  { id: "login", label: "Login" },
  { id: "register", label: "Criar conta" },
  { id: "reset", label: "Esqueci minha conta" },
] as const;

type AuthTab = (typeof tabs)[number]["id"];
type InstitutionType = "hospital" | "clinica" | "banco_de_sangue" | "ong" | "outra";

type FormState = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  userType: "doador" | "instituicao";
  institutionName: string;
  institutionType: InstitutionType;
  nif: string;
  province: string;
  municipality: string;
  neighborhood: string;
};

const institutionTypes: { value: InstitutionType; label: string }[] = [
  { value: "hospital", label: "Hospital" },
  { value: "clinica", label: "Clínica" },
  { value: "banco_de_sangue", label: "Banco de sangue" },
  { value: "ong", label: "ONG" },
  { value: "outra", label: "Outra" },
];

const provinces = [
  "Bengo",
  "Benguela",
  "Bié",
  "Cabinda",
  "Cuando",
  "Cubango",
  "Cuanza Norte",
  "Cuanza Sul",
  "Cunene",
  "Huambo",
  "Huíla",
  "Icolo e Bengo",
  "Luanda",
  "Lunda Norte",
  "Lunda Sul",
  "Malanje",
  "Moxico",
  "Moxico Leste",
  "Namibe",
  "Uíge",
  "Zaire",
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

const initialState: FormState = {
  email: "",
  password: "",
  fullName: "",
  phone: "",
  userType: "doador",
  institutionName: "",
  institutionType: "outra",
  nif: "",
  province: "",
  municipality: "",
  neighborhood: "",
};

export default function AuthPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (data.session) {
        router.replace("/");
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace("/");
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const isInstitution = form.userType === "instituicao";

  const submitText = useMemo(() => {
    if (activeTab === "login") return "Entrar";
    if (activeTab === "register") return "Criar conta";
    return "Enviar link de recuperação";
  }, [activeTab]);

  const selectedMunicipalities = form.province ? municipalitiesByProvince[form.province] ?? [] : [];

  const locationSummary = [form.province, form.municipality, form.neighborhood].filter(Boolean).join(" / ");

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => {
      if (field === "province") {
        return { ...prev, province: value, municipality: "" };
      }

      return { ...prev, [field]: value };
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (activeTab === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });

        if (error) throw error;

        router.replace("/");
        return;
      }

      if (activeTab === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
          redirectTo: `${window.location.origin}/auth`,
        });

        if (error) throw error;

        setMessage({
          type: "success",
          text: "Enviámos um link de recuperação para o seu email.",
        });
        return;
      }

      if (!form.email || !form.password) {
        throw new Error("Email e senha são obrigatórios.");
      }

      if (isInstitution && (!form.institutionName.trim() || !form.fullName.trim() || !form.phone.trim() || !form.province)) {
        throw new Error("Preencha o nome da instituição, responsável, telefone e província.");
      }

      const localizedValue = [form.province, form.municipality, form.neighborhood].filter(Boolean).join(" / ");

      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            papel: form.userType,
            nome_completo: form.fullName || form.institutionName || "",
            telefone: form.phone || null,
            instituicao_nome: form.institutionName || null,
            instituicao_tipo: form.institutionType,
            instituicao_nif: form.nif || null,
            localizacao: localizedValue || null,
            provincia: form.province || null,
            municipio: form.municipality || null,
            bairro: form.neighborhood || null,
          },
        },
      });

      if (error) throw error;

      if (data.user && !data.session) {
        setMessage({
          type: "success",
          text: isInstitution
            ? "Conta criada! Verifique o seu email. A instituição ficará pendente até ser verificada pela equipa."
            : "Conta criada! Verifique o seu email para confirmar a conta.",
        });
      } else {
        setMessage({ type: "success", text: "Conta criada com sucesso." });
        router.replace("/");
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "Ocorreu um erro.";
      setMessage({ type: "error", text: messageText });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-6 overflow-hidden rounded-[32px] border border-zinc-800 bg-zinc-950/80 shadow-2xl shadow-black/30 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col justify-between bg-gradient-to-br from-rose-600 via-rose-500 to-orange-500 p-8 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-100">SoftVida</p>
            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
              Faça parte da rede de solidariedade.
            </h1>
            <p className="mt-4 max-w-md text-sm text-rose-50/90">
              Conectamos doadores e instituições para agilizar ajudas, alertas e apoio humano em Angola.
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-sm font-medium text-rose-50">Cadastro simples</p>
            <ul className="mt-3 space-y-2 text-sm text-rose-50/90">
              <li>• Dados mínimos no primeiro passo</li>
              <li>• Completar perfil depois do login</li>
              <li>• Instituições podem criar conta e aguardar verificação</li>
            </ul>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? "bg-white text-zinc-900"
                    : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === "register" && (
              <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <div>
                  <span className="mb-2 block text-sm font-medium text-zinc-300">Tipo de conta</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(["doador", "instituicao"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        aria-pressed={form.userType === type}
                        onClick={() => handleChange("userType", type)}
                        className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                          form.userType === type
                            ? "border-rose-500 bg-rose-500/10 text-rose-200"
                            : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        }`}
                      >
                        {type === "doador" ? "Doador" : "Instituição"}
                      </button>
                    ))}
                  </div>
                </div>

                {isInstitution && (
                  <>
                    <label className="block text-sm text-zinc-300">
                      <span className="mb-2 block">Nome da instituição *</span>
                      <input
                        value={form.institutionName}
                        onChange={(e) => handleChange("institutionName", e.target.value)}
                        placeholder="Ex: Hospital Central"
                        required
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white placeholder:text-zinc-500 outline-none transition focus:border-rose-500"
                      />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm text-zinc-300">
                        <span className="mb-2 block">Tipo de instituição *</span>
                        <select
                          value={form.institutionType}
                          onChange={(e) => handleChange("institutionType", e.target.value)}
                          required
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white outline-none transition focus:border-rose-500"
                        >
                          {institutionTypes.map((type) => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-sm text-zinc-300">
                        <span className="mb-2 block">NIF</span>
                        <input
                          value={form.nif}
                          onChange={(e) => handleChange("nif", e.target.value)}
                          placeholder="Número de identificação fiscal"
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white placeholder:text-zinc-500 outline-none transition focus:border-rose-500"
                        />
                      </label>
                    </div>
                  </>
                )}

                <label className="block text-sm text-zinc-300">
                  <span className="mb-2 block">{isInstitution ? "Nome do responsável *" : "Nome completo"}</span>
                  <input
                    value={form.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    placeholder={isInstitution ? "Nome da pessoa responsável pela conta" : "Ex: Ana Mário"}
                    required={isInstitution}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white placeholder:text-zinc-500 outline-none transition focus:border-rose-500"
                  />
                </label>

                <label className="block text-sm text-zinc-300">
                  <span className="mb-2 block">Telefone</span>
                  <input
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+244 923 000 000"
                    required={isInstitution}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white placeholder:text-zinc-500 outline-none transition focus:border-rose-500"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm text-zinc-300">
                    <span className="mb-2 block">Província</span>
                    <select
                      value={form.province}
                      onChange={(e) => handleChange("province", e.target.value)}
                      required={isInstitution}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white outline-none transition focus:border-rose-500"
                    >
                      <option value="">Selecione a província</option>
                      {provinces.map((province) => (
                        <option key={province} value={province}>{province}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm text-zinc-300">
                    <span className="mb-2 block">Município</span>
                    <select
                      value={form.municipality}
                      onChange={(e) => handleChange("municipality", e.target.value)}
                      disabled={!form.province}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white outline-none transition focus:border-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">{form.province ? "Selecione o município" : "Escolha primeiro a província"}</option>
                      {selectedMunicipalities.map((municipality) => (
                        <option key={municipality} value={municipality}>{municipality}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block text-sm text-zinc-300">
                  <span className="mb-2 block">Bairro (opcional)</span>
                  <input
                    value={form.neighborhood}
                    onChange={(e) => handleChange("neighborhood", e.target.value)}
                    placeholder="Ex: Bairro Operário"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white placeholder:text-zinc-500 outline-none transition focus:border-rose-500"
                  />
                </label>

                {locationSummary && (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-xs text-rose-200">
                    Localização: <span className="font-semibold text-white">{locationSummary}</span>
                  </div>
                )}

                {isInstitution && (
                  <p className="text-xs text-amber-200">
                    O cadastro da instituição será enviado para verificação antes de poder usar as funcionalidades da plataforma.
                  </p>
                )}
              </div>
            )}

            {activeTab !== "reset" && (
              <div className="space-y-4">
                <label className="block text-sm text-zinc-300">
                  <span className="mb-2 block">Email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="nome@email.com"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white placeholder:text-zinc-500 outline-none transition focus:border-rose-500"
                    required
                  />
                </label>

                <label className="block text-sm text-zinc-300">
                  <span className="mb-2 block">Senha</span>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white placeholder:text-zinc-500 outline-none transition focus:border-rose-500"
                    required
                  />
                </label>
              </div>
            )}

            {message && (
              <div
                className={`rounded-xl border px-3 py-2 text-sm ${
                  message.type === "success"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-rose-500/40 bg-rose-500/10 text-rose-300"
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Aguarde..." : submitText}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-zinc-400">
            <Link href="/forgot-password" className="font-medium text-rose-300 hover:text-rose-200">
              Esqueci minha conta
            </Link>
          </div>

          <div className="mt-6 text-center text-sm text-zinc-400">
            Já tem conta? {" "}
            <button type="button" onClick={() => setActiveTab("login")} className="font-semibold text-white underline underline-offset-4">
              Fazer login
            </button>
          </div>

          <div className="mt-4 text-center text-xs text-zinc-500">
            <Link href="/" className="hover:text-zinc-300">
              Voltar para a home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
