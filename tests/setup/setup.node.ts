import { vi } from "vitest";

// Bloque les sorties console trop bruyantes en test (optionnel)
const origError = console.error;
console.error = (...args: any[]) => {
  if (String(args[0]).includes("Warning:")) return;
  origError(...args);
};

// Mock global fetch si besoin
if (!globalThis.fetch) {
  // @ts-ignore
  globalThis.fetch = async () => ({ ok: true, json: async () => ({}) });
}

// Variables d'env minimales pour éviter les throws
process.env.NEXT_PUBLIC_SUPABASE_URL ||= "http://localhost:54321";
process.env.SUPABASE_SERVICE_KEY ||= "test-service-key";
process.env.EMAIL_FROM ||= "Relansia <no-reply@test>";
