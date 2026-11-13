"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function loadDonorProfile(userId: string) {
  const supabase = createSupabaseServerClient();

  const [perfilResult, doadorResult] = await Promise.all([
    supabase.from("perfis").select("nome_completo, telefone, papel").eq("id", userId).maybeSingle(),
    supabase.from("doadores").select("*").eq("utilizador_id", userId).maybeSingle(),
  ]);

  if (perfilResult.error) throw new Error(perfilResult.error.message);
  if (doadorResult.error) throw new Error(doadorResult.error.message);

  return {
    perfil: perfilResult.data,
    doador: doadorResult.data,
  };
}

export async function saveDonorProfile(input: {
  userId: string;
  nome_completo: string;
  telefone?: string | null;
  tipo_sanguineo?: string | null;
  sexo?: string | null;
  data_nascimento?: string | null;
  peso_kg?: number | null;
  altura_cm?: number | null;
  doencas_cronicas?: string | null;
  medicacao?: string | null;
  tatuagem_recente?: boolean;
  viagem_recente?: boolean;
  fumador?: boolean;
  consome_alcool?: boolean;
  disponivel?: boolean;
  perfil_publico?: boolean;
  partilhar_dados_saude?: boolean;
  ultima_doacao_em?: string | null;
  bairro?: string | null;
  provincia_id?: number | null;
  municipio_id?: number | null;
  lat?: number | null;
  lng?: number | null;
  distancia_maxima_km?: number;
  nivel_minimo_alerta?: string;
}) {
  const supabase = createSupabaseServerClient();

  const perfilPayload = {
    id: input.userId,
    papel: "doador",
    nome_completo: input.nome_completo?.trim() || null,
    telefone: input.telefone || null,
  };

  const { error: perfilError } = await supabase.from("perfis").upsert(perfilPayload, { onConflict: "id" });
  if (perfilError) throw new Error(perfilError.message);

  const doadorPayload = {
    utilizador_id: input.userId,
    tipo_sanguineo: input.tipo_sanguineo || null,
    sexo: input.sexo || null,
    // coluna "date": enviar a data tal como vem (AAAA-MM-DD)
    data_nascimento: input.data_nascimento || null,
    peso_kg: input.peso_kg ?? null,
    altura_cm: input.altura_cm ?? null,
    doencas_cronicas: input.doencas_cronicas || null,
    medicacao: input.medicacao || null,
    tatuagem_recente: Boolean(input.tatuagem_recente),
    viagem_recente: Boolean(input.viagem_recente),
    fumador: Boolean(input.fumador),
    consome_alcool: Boolean(input.consome_alcool),
    disponivel: Boolean(input.disponivel),
    perfil_publico: Boolean(input.perfil_publico),
    partilhar_dados_saude: Boolean(input.partilhar_dados_saude),
    ultima_doacao_em: input.ultima_doacao_em ? new Date(input.ultima_doacao_em).toISOString() : null,
    bairro: input.bairro || null,
    provincia_id: input.provincia_id ?? null,
    municipio_id: input.municipio_id ?? null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    distancia_maxima_km: input.distancia_maxima_km ?? 10,
    nivel_minimo_alerta: input.nivel_minimo_alerta || "atencao",
  };

  const { error: doadorError } = await supabase.from("doadores").upsert(doadorPayload, { onConflict: "utilizador_id" });
  if (doadorError) throw new Error(doadorError.message);

  return { ok: true };
}

export async function createProfileForUser(input: {
  userId: string;
  email: string;
  fullName?: string;
  phone?: string;
  type?: "doador" | "instituicao";
  institutionName?: string;
  nif?: string;
  province?: string;
  municipality?: string;
  neighborhood?: string;
}) {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase.from("perfis").upsert(
    {
      id: input.userId,
      papel: input.type ?? "doador",
      nome_completo: input.fullName || input.institutionName || null,
      telefone: input.phone || null,
    },
    { onConflict: "id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  if (input.type === "instituicao") {
    // Resolve província/município pelo nome (usado para atribuir pedidos sem GPS)
    let provinciaId: number | null = null;
    let municipioId: number | null = null;

    if (input.province) {
      const { data: prov } = await supabase.from("provincias").select("id").ilike("nome", input.province).maybeSingle();
      provinciaId = prov?.id ?? null;
    }
    if (input.municipality && provinciaId) {
      const { data: mun } = await supabase
        .from("municipios")
        .select("id")
        .eq("provincia_id", provinciaId)
        .ilike("nome", input.municipality)
        .maybeSingle();
      municipioId = mun?.id ?? null;
    }

    const payload = {
      nome: input.institutionName || "Instituição",
      nif: input.nif || null,
      telefone: input.phone || null,
      provincia_id: provinciaId,
      municipio_id: municipioId,
      endereco: [input.neighborhood, input.municipality, input.province].filter(Boolean).join(", ") || null,
    };

    // "dono_id" não é único na base de dados, por isso não se usa upsert com onConflict
    const { data: existing, error: findError } = await supabase
      .from("instituicoes")
      .select("id")
      .eq("dono_id", input.userId)
      .order("criado_em")
      .limit(1)
      .maybeSingle();
    if (findError) throw new Error(findError.message);

    const { error: institutionError } = existing
      ? await supabase.from("instituicoes").update(payload).eq("id", existing.id)
      : await supabase.from("instituicoes").insert({ dono_id: input.userId, ...payload });

    if (institutionError) {
      throw new Error(institutionError.message);
    }
  }

  return { ok: true };
}

export async function getCurrentUserProfile(userId: string) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.from("perfis").select("*").eq("id", userId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}