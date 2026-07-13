"use client";

import Image from "next/image";
import { Wallet } from "lucide-react";
import { useEstado } from "@/lib/estado-context";
import { setMesReferencia } from "@/lib/acoes";
import { dadosCaixa } from "@/lib/calculos";
import { cn, dinheiro } from "@/lib/utils";

export function Header() {
  const { estado, atualizarEstado } = useEstado();
  const { saldo } = dadosCaixa(estado, estado.mes);

  return (
    <header className="sticky top-0 z-100 overflow-hidden bg-[linear-gradient(120deg,#1d4ed8_0%,#1e40af_55%,#b91c1c_100%)] text-white shadow-[0_4px_24px_rgba(29,78,216,.28)]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle at 50% -40%, rgba(96,165,250,.35) 0%, transparent 55%)",
        }}
      />
      <div className="relative z-1 mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <Image
            src="/gibs-logo.avif"
            alt="GIBS"
            width={52}
            height={52}
            priority
            className="h-[52px] w-[52px] shrink-0 rounded-2xl border-2 border-white/25 bg-white/10 object-contain p-2 shadow-[0_8px_24px_rgba(0,0,0,.25)]"
          />
          <div>
            <h1 className="m-0 text-2xl font-extrabold leading-tight tracking-tight">
              Caixa do <span className="text-gold">Gibs FC</span>
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 max-md:w-full max-md:flex-col max-md:items-stretch">
          <div className="flex items-center gap-2.5 rounded-lg border border-red bg-white/10 px-4 py-2 shadow-[0_4px_14px_rgba(0,0,0,.12)] backdrop-blur-sm max-md:w-full">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold">
              <Wallet className="size-4" />
            </span>
            <div className="leading-tight">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-white/60">Saldo atual</span>
              <strong className={cn("block text-base font-extrabold", saldo < 0 ? "text-red-light" : "text-white")}>
                {dinheiro(saldo)}
              </strong>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-lg border border-red bg-white/10 px-3.5 py-2.5 shadow-[0_4px_14px_rgba(0,0,0,.12)] max-md:w-full max-md:flex-col max-md:items-stretch">
            <label
              htmlFor="mesReferencia"
              className="whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-white/75"
            >
              Mês de referência
            </label>
            <input
              id="mesReferencia"
              type="month"
              value={estado.mes}
              onChange={(e) => atualizarEstado((atual) => setMesReferencia(atual, e.target.value))}
              className="min-h-0 w-auto rounded-sm border border-white/20 bg-white/[.13] px-2.5 py-1.5 text-sm font-bold text-white outline-none focus:border-gold focus:shadow-[0_0_0_3px_rgba(245,158,11,.3)] max-md:w-full"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
