// lib/providers/types.ts

/** Canaux supportés */
export type Channel = "email" | "sms" | "whatsapp";

/** Coordonnées client (toutes optionnelles pour simplifier les payloads) */
export type ClientContact = {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

/** Payload de base commun */
type BasePayload = {
  /** reminder.id */
  id: string;
  /** message libre éventuel; peut être redéfini par la règle/reminder côté serveur */
  message?: string | null;
  /** coordonnées du destinataire (si dispo côté appelant) */
  client?: ClientContact;
  /** métadonnées libres */
  meta?: Record<string, any> | undefined;
};

/** Payloads par canal (avec narrows) */
export type EmailPayload = BasePayload & { channel: "email"; };
export type SmsPayload = BasePayload & { channel: "sms"; };
export type WhatsAppPayload = BasePayload & { channel: "whatsapp"; };

/** Union globale utilisée par le dispatcher */
export type SendPayload = EmailPayload | SmsPayload | WhatsAppPayload;

/** Résultat standardisé des providers */
export type ProviderSuccess = {
  ok: true;
  /** id retourné par le provider (ex: Resend message id) */
  providerId: string | null;
  /** horodatage ISO de l’action côté serveur */
  at: string;
};

export type ProviderFailure = {
  ok: false;
  /** code d’erreur normalisé (ex: "missing_email", "resend_failed", …) */
  error: string;
  /** détail lisible (non PII) */
  detail?: string | null;
};

export type ProviderResult = ProviderSuccess | ProviderFailure;
