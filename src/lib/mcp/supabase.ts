import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

type RuntimeGlobals = typeof globalThis & {
  Deno?: { env?: { get?: (name: string) => string | undefined } };
  process?: { env?: Record<string, string | undefined> };
};

function runtimeEnv(name: string): string | undefined {
  const runtime = globalThis as RuntimeGlobals;
  return runtime.Deno?.env?.get?.(name) ?? runtime.process?.env?.[name];
}

function configuredEnv(names: readonly string[]): string | undefined {
  for (const name of names) {
    const value = runtimeEnv(name)?.trim();
    if (value) return value;
  }
  return undefined;
}

// O app aponta para o projeto de dados definido em VITE_SUPABASE_* (inlined no build).
const BUILD_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const BUILD_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

function supabaseProjectUrl(): string {
  const url = BUILD_URL?.trim() || configuredEnv(["SUPABASE_URL"]);
  if (!url) throw new Error("SUPABASE_URL não configurada");
  return url;
}

function supabasePublishableKey(): string {
  if (BUILD_KEY?.trim()) return BUILD_KEY.trim();
  const direct = configuredEnv(["SUPABASE_PUBLISHABLE_KEY"]);
  if (direct) return direct;
  const keyset = runtimeEnv("SUPABASE_PUBLISHABLE_KEYS");
  if (keyset) {
    try {
      const parsed: unknown = JSON.parse(keyset);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const keys = parsed as Record<string, unknown>;
        const key = [keys.default, ...Object.values(keys)]
          .find((v): v is string => typeof v === "string" && v.trim().startsWith("sb_publishable_"))
          ?.trim();
        if (key) return key;
      }
    } catch {
      // formato inesperado; tenta os nomes legados abaixo
    }
  }
  const legacy = configuredEnv(["SUPABASE_ANON_KEY"]);
  if (legacy) return legacy;
  throw new Error("Chave publicável do Supabase não configurada");
}

/** Cliente com a identidade do usuário autenticado (respeita RLS). */
export function supabaseForUser(ctx: ToolContext) {
  const token = ctx.getToken();
  if (!token) throw new Error("Requisição sem token OAuth verificado");
  return createClient(supabaseProjectUrl(), supabasePublishableKey(), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function requireAuth(ctx: ToolContext) {
  if (!ctx.isAuthenticated()) {
    throw new Error("Não autenticado. Conecte-se com uma conta do sistema.");
  }
}

export function jsonResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true as const };
}
