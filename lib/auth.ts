// Gate de acesso simples para a área administrativa.
//
// ATENÇÃO: isto é apenas uma proteção de interface — o Realtime Database continua
// legível publicamente (a config está no bundle). Para proteger os dados de fato,
// no futuro configure Firebase Auth + regras de segurança no console.

const CHAVE = "gibs_auth";

/** Senha compartilhada. Defina NEXT_PUBLIC_ADMIN_PASSWORD no .env.local para trocar. */
export const SENHA_ADMIN = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "gibs2026";

export function estaAutenticado(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(CHAVE) === "1";
}

/** Retorna true se a senha bate e marca a sessão como autenticada. */
export function entrar(senha: string): boolean {
  if (senha !== SENHA_ADMIN) return false;
  window.localStorage.setItem(CHAVE, "1");
  return true;
}

export function sair(): void {
  window.localStorage.removeItem(CHAVE);
}
