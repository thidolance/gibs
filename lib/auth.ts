// Gate de acesso à área administrativa.
//
// A senha NÃO fica em texto no código: guardamos só o hash SHA-256 dela. Ao logar,
// o navegador calcula o hash do que foi digitado e compara — então inspecionar o
// site não revela a senha.
//
// ATENÇÃO (limite conhecido): isto ainda é uma proteção de interface. O Realtime
// Database continua legível publicamente. Para proteção real (bloquear leitura dos
// dados), o caminho é Firebase Auth + regras de segurança no console.

const CHAVE = "gibs_auth";

/** SHA-256 da senha de acesso (a senha em texto não aparece em lugar nenhum do bundle). */
const HASH_SENHA = "0a9b85a6f25ac0fe613fa7dcb0d08f800ecc792cfc5fa369061f203ad9c1e222";

async function sha256(texto: string): Promise<string> {
  const dados = new TextEncoder().encode(texto);
  const buffer = await crypto.subtle.digest("SHA-256", dados);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function estaAutenticado(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(CHAVE) === HASH_SENHA;
}

/** Retorna true se a senha bate (comparando hashes) e marca a sessão como autenticada. */
export async function entrar(senha: string): Promise<boolean> {
  const hash = await sha256(senha);
  if (hash !== HASH_SENHA) return false;
  window.localStorage.setItem(CHAVE, HASH_SENHA);
  return true;
}

export function sair(): void {
  window.localStorage.removeItem(CHAVE);
}
