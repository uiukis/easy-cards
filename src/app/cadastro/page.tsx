"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Phone, User, Loader2, Eye, EyeOff, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { maskPhoneBR, toE164BR } from "@/lib/phone";
import { AuthShell, authFieldClass } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CadastroPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

    router.push("/portal");
    router.refresh();
  }

  return (
    <AuthShell
      title="CRIAR CONTA"
      tagline="Faça parte da comunidade"
      subtitle="Leva menos de um minuto — só telefone e senha."
      footer={
        <>
          <span>
            Já tem conta?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Entrar
            </Link>
          </span>
          <span className="mt-3 block leading-snug text-ink-muted/80">
            Sua conta começa como cliente. Permissões de equipe são liberadas por um administrador.
          </span>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="full_name" className="text-xs font-semibold text-ink-muted">
            <User className="h-3.5 w-3.5" /> Nome completo
          </Label>
          <Input
            id="full_name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Seu nome"
            className={authFieldClass}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-xs font-semibold text-ink-muted">
            <Phone className="h-3.5 w-3.5" /> Telefone
          </Label>
          <Input
            id="phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(maskPhoneBR(e.target.value))}
            placeholder="(11) 91234-5678"
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
              placeholder="Pelo menos 6 caracteres"
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

        <div className="space-y-1.5">
          <Label htmlFor="confirm_password" className="text-xs font-semibold text-ink-muted">
            <Lock className="h-3.5 w-3.5" /> Confirmar senha
          </Label>
          <Input
            id="confirm_password"
            type={showPassword ? "text" : "password"}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita a senha"
            className={authFieldClass}
          />
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
          Criar conta
        </Button>
      </form>
    </AuthShell>
  );
}
