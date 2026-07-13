"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { onValue, ref, set } from "firebase/database";
import { db } from "./firebase";
import { estadoInicial, type Estado } from "./types";
import { normalizarEstado } from "./calculos";

const CAMINHO_ESTADO = "estado";

interface EstadoContextValue {
  estado: Estado;
  carregando: boolean;
  salvando: boolean;
  erro: string | null;
  atualizarEstado: (atualizar: (estado: Estado) => Estado) => void;
}

const EstadoContext = createContext<EstadoContextValue | null>(null);

export function EstadoProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>(estadoInicial);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const ignorarProximoValor = useRef(false);

  useEffect(() => {
    const estadoRef = ref(db, CAMINHO_ESTADO);
    const unsubscribe = onValue(
      estadoRef,
      (snapshot) => {
        if (ignorarProximoValor.current) {
          ignorarProximoValor.current = false;
          setCarregando(false);
          return;
        }
        const valor = snapshot.val();
        if (valor) {
          setEstado(normalizarEstado(valor));
        } else {
          set(estadoRef, estadoInicial).catch((e) => setErro(String(e)));
          setEstado(estadoInicial);
        }
        setCarregando(false);
      },
      (e) => {
        setErro(e.message);
        setCarregando(false);
      },
    );
    return () => unsubscribe();
  }, []);

  function atualizarEstado(atualizar: (estado: Estado) => Estado) {
    setEstado((atual) => {
      const novo = atualizar(atual);
      setSalvando(true);
      ignorarProximoValor.current = true;
      set(ref(db, CAMINHO_ESTADO), novo)
        .catch((e) => setErro(String(e)))
        .finally(() => setSalvando(false));
      return novo;
    });
  }

  return (
    <EstadoContext.Provider value={{ estado, carregando, salvando, erro, atualizarEstado }}>
      {children}
    </EstadoContext.Provider>
  );
}

export function useEstado() {
  const ctx = useContext(EstadoContext);
  if (!ctx) throw new Error("useEstado precisa ser usado dentro de <EstadoProvider>");
  return ctx;
}
