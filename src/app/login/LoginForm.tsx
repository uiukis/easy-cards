"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, AtSign, Loader2, Eye, EyeOff, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { maskPhoneBR, toE164BR } from "@/lib/phone";
import { AuthShell, authFieldClass } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEmail = identifier.includes("@");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(
      isEmail
        ? { email: identifier.trim(), password }
        : { phone: toE164BR(identifier), password }
    );

    if (error) {
      setError(isEmail ? "Email ou senha incorretos." : "Número ou senha incorretos.");
      setLoading(false);
      return;
    }

    router.push(searchParams.get("next") || "/portal");
    router.refresh();
  }

  return (
    <AuthShell
      title="ENTRAR"
      tagline="Bem-vindo de volta!"
      subtitle="Entre pra ver suas compras e montar seu fichário."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-semibold text-primary hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="identifier" className="text-xs font-semibold text-ink-muted">
            <AtSign className="h-3.5 w-3.5" /> Telefone ou email
          </Label>
          <Input
            id="identifier"
            required
            value={identifier}
            onChange={(e) =>
              setIdentifier(e.target.value.includes("@") ? e.target.value : maskPhoneBR(e.target.value))
            }
            placeholder="(11) 91234-5678 ou voce@email.com"
            className={authFieldClass}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold text-ink-muted">
            <Lock className="h-3.5 w-3.5" /> Senha
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              className={`${authFieldClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted transition-colors hover:text-ink"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-full text-sm font-bold shadow-lg shadow-primary/25 transition-transform hover:scale-[1.02] active:scale-95"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Entrar
        </Button>
      </form>
    </AuthShell>
  );
}
