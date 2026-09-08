"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Phone, User, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { maskPhoneBR, toE164BR } from "@/lib/phone";

export default function CadastroPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      phone: toE164BR(phone),
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      setError(
        error.message.includes("already registered") || error.message.includes("exists")
          ? "Esse número já tem uma conta."
          : "Não deu pra criar a conta. Confira os dados e tente de novo."
      );
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-5">
      <div className="w-full max-w-sm rounded-2xl border-2 border-ink/10 bg-surface p-8">
        <h1 className="font-display text-2xl text-ink">CRIAR CONTA</h1>
        <p className="mt-1 text-sm text-ink-muted">Acesso da equipe Easy Cards.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
              <User className="h-3.5 w-3.5" /> Nome completo
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border-2 border-ink/10 bg-bg px-4 py-2.5 text-sm text-ink outline-none focus:border-orange-deep"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
              <Phone className="h-3.5 w-3.5" /> Telefone
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(maskPhoneBR(e.target.value))}
              placeholder="(85) 99428-6518"
              className="w-full rounded-xl border-2 border-ink/10 bg-bg px-4 py-2.5 text-sm text-ink outline-none focus:border-orange-deep"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
              <Lock className="h-3.5 w-3.5" /> Senha
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border-2 border-ink/10 bg-bg px-4 py-2.5 text-sm text-ink outline-none focus:border-orange-deep"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
              <Lock className="h-3.5 w-3.5" /> Confirmar senha
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border-2 border-ink/10 bg-bg px-4 py-2.5 text-sm text-ink outline-none focus:border-orange-deep"
            />
          </div>

          {error && <p className="text-sm text-orange-deep">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-orange-deep px-4 py-2.5 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Criar conta
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-ink-muted">
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold text-orange-deep hover:underline">
            Entrar
          </Link>
        </p>

        <p className="mt-3 text-center text-[11px] leading-snug text-ink-muted">
          Sua conta começa como cliente. Permissões de equipe são liberadas por um administrador.
        </p>
      </div>
    </main>
  );
}
