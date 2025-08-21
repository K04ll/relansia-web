// lib/logging.ts

/** JSON.stringify sûr (gère références circulaires + Error) */
export function safeJSONStringify(obj: any): string {
  const seen = new WeakSet();
  try {
    return JSON.stringify(
      obj,
      (_k, v) => {
        if (typeof v === "object" && v !== null) {
          if (seen.has(v)) return "[Circular]";
          seen.add(v);
        }
        if (v instanceof Error) {
          return { name: v.name, message: v.message, stack: v.stack, code: (v as any)?.code ?? undefined };
        }
        return v;
      }
    );
  } catch {
    try { return JSON.stringify({ value: String(obj) }); } catch { return String(obj); }
  }
}

export type ErrorInfo = { code: string | null; message: string };

/** Convertit toute erreur en {code,message} lisible et court */
export function toErrorInfo(err: any, maxLen = 1000): ErrorInfo {
  // 1) Erreur native
  if (err instanceof Error) {
    const code = (err as any).code ? String((err as any).code) : null;
    const msg = `${err.name}: ${err.message}`.slice(0, maxLen);
    return { code, message: msg };
  }

  // 2) Objets d’erreur style API
  const code =
    err && (err.code || err.status || err.error_code)
      ? String(err.code || err.status || err.error_code)
      : null;

  if (err && (err.message || err.error || err.detail)) {
    const raw = String(err.message || err.error || err.detail);
    return { code, message: raw.slice(0, maxLen) };
  }

  // 3) Fallback sûr
  const raw = safeJSONStringify(err);
  return { code, message: (raw.length > maxLen ? raw.slice(0, maxLen) + "…(truncated)" : raw) };
}

/** Construit un JSON compact et lisible pour stockage DB */
export function errorJSON(code: string | null, message: string) {
  return JSON.stringify({ code, message });
}

/** Horodatage ISO */
export function nowISO() { return new Date().toISOString(); }

/** Codes standardisés (utiles côté produit & logs) */
export const ERROR = {
  MISSING_EMAIL: { code: "missing_email", message: "Le client n’a pas d’adresse email." },
  MISSING_PHONE: { code: "missing_phone", message: "Le client n’a pas de numéro de téléphone." },
  EMPTY_MESSAGE: { code: "empty_message", message: "Message vide, aucune relance envoyée." },
  DOMAIN_NOT_VERIFIED: { code: "domain_not_verified", message: "Resend : domaine non validé." },
  PROVIDER_ERROR: { code: "provider_error", message: "Erreur du provider." },
};
