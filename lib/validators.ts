// lib/validators.ts
import { z } from "zod";

/**
 * Mapping CSV (Step 1)
 */
export const csvMappingSchema = z.object({
  email: z.string().optional(),
  phone: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

/**
 * Fenêtre d'envoi (horaires + jours)
 * - start/end au format "HH:MM" (24h)
 * - days = tableau de nombres (0..6) => 0=Dimanche, 1=Lundi, ...
 */
export const sendWindowSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM"),
  end: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM"),
  days: z.array(z.number().int().min(0).max(6)).nonempty(),
});

/**
 * Settings (Step 2)
 */
export const settingsSchema = z.object({
  store_name: z.string().min(1, "Nom boutique requis"),
  sender_name: z.string().min(1, "Nom expéditeur requis"),
  timezone: z.string().min(1, "Timezone requise"),
  send_window: sendWindowSchema,
  signature: z.string().default(""),
});

/**
 * Rules (Step 3)
 * - delay_days: J+1, J+2, J+7 etc.
 * - channel: "email" | "sms" | "whatsapp"
 * - template: contenu du message (avec tokens)
 * - position: ordre d’exécution (0,1,2,...)
 * - enabled: active/inactive
 */
export const ruleSchema = z.object({
  id: z.string().uuid().optional(), // peut être créé côté serveur
  delay_days: z.number().int().min(0).max(365),
  channel: z.enum(["email", "sms", "whatsapp"]),
  template: z.string().min(1, "Template requis"),
  position: z.number().int().min(0),
  enabled: z.boolean().default(true),
});

export const rulesArraySchema = z.array(ruleSchema);
