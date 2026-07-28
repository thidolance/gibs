"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { KeyRound, Lock, ExternalLink } from "lucide-react";
import { entrar, estaAutenticado } from "@/lib/auth";

/** Protege toda a área administrativa atrás de uma senha compartilhada. */
export function AuthGate({ children }: { children: ReactNode }) {
  const [montado, setMontado] = useState(false);
  const [autenticado, setAutenticado] = useState(false);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(false);

  useEffect(() => {
    setAutenticado(estaAutenticado());
    setMontado(true);
  }, []);

  // Evita flash de conteúdo protegido antes de ler o localStorage.
  if (!montado) return null;
  if (autenticado) return <>{children}</>;

  async function tentarEntrar(e: React.FormEvent) {
    e.preventDefault();
    if (await entrar(senha)) {
      setAutenticado(true);
    } else {
      setErro(true);
      setSenha("");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[linear-gradient(160deg,#0a1730_0%,#12256a_55%,#7f1d1d_100%)] px-5 py-10">
      <div className="w-full max-w-[380px] overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] p-7 text-white shadow-[0_24px_60px_-15px_rgba(0,0,0,.6)] backdrop-blur-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Image
            src="/gibs-logo.avif"
            alt="Gibs FC"
            width={68}
            height={68}
            priority
            className="h-[68px] w-[68px] rounded-2xl border-2 border-white/25 bg-white/10 object-contain p-2 shadow-lg"
          />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">
              Caixa do <span className="text-gold">Gibs FC</span>
            </h1>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-white/55">
              <Lock className="size-3.5" /> Área administrativa
            </p>
          </div>
        </div>

        <form onSubmit={tentarEntrar} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/70">
            Senha de acesso
            <input
              type="password"
              autoFocus
              value={senha}
              onChange={(e) => {
                setSenha(e.target.value);
                setErro(false);
              }}
              placeholder="••••••••"
              className="min-h-11 rounded-md border border-white/20 bg-white/10 px-3.5 py-2 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-gold focus:shadow-[0_0_0_3px_rgba(245,158,11,.3)]"
            />
          </label>

          {erro && <p className="text-[12.5px] font-semibold text-red-light">Senha incorreta. Tente novamente.</p>}

          <button
            type="submit"
            className="mt-1 flex min-h-11 items-center justify-center gap-2 rounded-md bg-gold px-4 py-2 text-sm font-extrabold text-[#3a2500] transition-colors hover:bg-gold-dark hover:text-white"
          >
            <KeyRound className="size-4" /> Entrar
          </button>
        </form>

        <a
          href="/inicio.html"
          className="mt-5 flex items-center justify-center gap-1.5 text-[12.5px] font-semibold text-white/60 transition-colors hover:text-gold"
        >
          <ExternalLink className="size-3.5" /> Ver painel público (classificação, rodadas, ranking e loja)
        </a>
      </div>
    </div>
  );
}
