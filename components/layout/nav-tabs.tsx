"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { sair } from "@/lib/auth";
import { cn } from "@/lib/utils";

const ABAS = [
  { href: "/painel", label: "Dashboard" },
  { href: "/jogadores", label: "Jogadores" },
  { href: "/mensalistas", label: "Mensalistas" },
  { href: "/classificacao", label: "Classificação" },
  { href: "/ranking", label: "Ranking" },
  { href: "/loja", label: "Loja" },
  { href: "/avulsos", label: "Avulsos" },
  { href: "/caixa", label: "Balanço de caixa" },
  { href: "/configuracoes", label: "Configurações" },
] as const;

export function NavTabs() {
  const pathname = usePathname();

  function aoSair() {
    sair();
    window.location.reload();
  }

  return (
    <div className="sticky top-[84px] z-99 border-b border-border bg-surface shadow-xs max-md:static">
      <nav className="mx-auto flex max-w-[1280px] items-center gap-0 overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ABAS.map((aba) => {
          const ativa = pathname === aba.href;
          return (
            <Link
              key={aba.href}
              href={aba.href}
              className={cn(
                "flex h-[46px] shrink-0 items-center whitespace-nowrap border-b-[2.5px] border-transparent px-4 text-[13px] font-semibold tracking-[0.01em] text-muted transition-colors hover:border-border-2 hover:text-blue",
                ativa && "border-accent text-blue",
              )}
            >
              {aba.label}
            </Link>
          );
        })}
        <button
          onClick={aoSair}
          title="Sair"
          className="ml-auto flex h-[46px] shrink-0 items-center gap-1.5 whitespace-nowrap px-4 text-[13px] font-semibold text-muted transition-colors hover:text-red"
        >
          <LogOut className="size-4" /> Sair
        </button>
      </nav>
    </div>
  );
}
