"use server";
import "server-only";

import { Resend } from "resend";
import { render } from "@react-email/render";
import ReminderEmail from "@/emails/ReminderEmail";
import { createClient } from "@supabase/supabase-js";

// ---------- Types ----------
export type ProviderSuccess = {
  ok: true;
  providerId: string | null;
  at: string;
};

export type ProviderFailure = {
  ok: false;
  error: string;
  detail?: string | null;
};

export type ProviderResult = ProviderSuccess | ProviderFailure;

type SendPayload = {
  id: string; // reminder.id
  channel: "email";
  client?: {
    email?: string | null;
    phone?: string | null;
  };
  subject?: string | null;
  message?: string | null;
};

// ---------- Inits ----------
const resend = new Resend(process.env.RESEND_API_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// ---------- Helper ----------
const nowISO = () => new Date().toISOString();
const baseAppUrl = () =>
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

// ---------- Main ----------
export async function sendEmail(payload: SendPayload): Promise<ProviderResult> {
  try {
    // 1) Charger le reminder (user_id, client_id, message)
    const { data: reminderRow, error: rErr } = await supabase
      .from("reminders")
      .select("user_id, client_id, message")
      .eq("id", payload.id)
      .maybeSingle();

    if (rErr || !reminderRow) {
      return { ok: false, error: "reminder_not_found", detail: rErr?.message ?? "no row" };
    }

    // 2) Charger le client à partir du client_id (fiable pour l’unsub)
    const { data: clientRow, error: cErr } = await supabase
      .from("clients")
      .select("id, email, first_name, unsubscribed")
      .eq("id", reminderRow.client_id)
      .maybeSingle();

    if (cErr || !clientRow) {
      return { ok: false, error: "client_not_found", detail: cErr?.message ?? "no row" };
    }

    if (clientRow.unsubscribed) {
      return { ok: false, error: "client_unsubscribed", detail: "User opted out" };
    }

    // 3) Destinataire & sujet
    const to = payload.client?.email ?? clientRow.email ?? null;
    if (!to) {
      return { ok: false, error: "missing_email", detail: "No recipient email" };
    }

    const subject = payload.subject ?? "Rappel Relansia";

    // 4) Construire l'URL de désabonnement (absolue)
    const appUrl = baseAppUrl();
    const unsubscribeUrl = appUrl ? `${appUrl}/api/unsub/${clientRow.id}` : undefined;

    // 5) Composer l'email React (message priorise payload.message sinon message du reminder)
    const reactEmail = (
      <ReminderEmail
        subject={subject}
        previewText="Un petit rappel automatique 📩"
        storeName="Relansia Demo Shop"
        senderName="Relansia"
        firstName={clientRow.first_name ?? undefined}
        message={payload.message ?? reminderRow.message ?? ""}
        offerUrl={null}
        signature="L’équipe Relansia"
        logoUrl={null}
        unsubscribeUrl={unsubscribeUrl}
      />
    );

    // 6) Générer un HTML complet (doctype/body) — PAS de texte => on force l'HTML côté client mail
    const html = await render(reactEmail, { pretty: true });

    // 7) Envoyer via Resend (UNIQUEMENT html)
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!, // ex: "Relansia <no-reply@tondomaine.com>"
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      headers: { "X-Entity-Ref-ID": payload.id },
    });

    if (error) {
      return { ok: false, error: "resend_failed", detail: error.message };
    }

    return {
      ok: true,
      providerId: (data as any)?.id ?? null,
      at: nowISO(),
    };
  } catch (e: any) {
    return { ok: false, error: "email_provider_error", detail: e?.message ?? String(e) };
  }
}
