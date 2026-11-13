"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      setMessage({ type: "success", text: "Link de recuperação enviado com sucesso." });
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "Não foi possível enviar o link.";
      setMessage({ type: "error", text: messageText });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-[28px] border border-zinc-800 bg-zinc-950/80 p-6 shadow-2xl shadow-black/30">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-400">SoftVida</p>
          <h1 className="mt-3 text-3xl font-bold text-white">Recuperar conta</h1>
          <p className="mt-2 text-sm text-zinc-400">Informe o seu email para receber o link de redefinição.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm text-zinc-300">
            <span className="mb-2 block">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@email.com"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white placeholder:text-zinc-500 outline-none transition focus:border-rose-500"
              required
            />
          </label>

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
            {loading ? "Enviando..." : "Enviar link"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-400">
          <Link href="/auth" className="text-white underline underline-offset-4">
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}
