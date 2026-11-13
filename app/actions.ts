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
  data_nascimento?: string | null;
  identificacao_legal?: string | null;
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
    data_nascimento: input.data_nascimento ? new Date(input.data_nascimento).toISOString() : null,
    identificacao_legal: input.identificacao_legal || null,
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
    const { error: institutionError } = await supabase.from("instituicoes").upsert(
      {
        dono_id: input.userId,
        nome: input.institutionName || "Instituição",
        nif: input.nif || null,
        telefone: input.phone || null,
        provincia_id: null,
        municipio_id: null,
        endereco: [input.province, input.municipality, input.neighborhood].filter(Boolean).join(" / ") || null,
      },
      { onConflict: "dono_id" }
    );

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
