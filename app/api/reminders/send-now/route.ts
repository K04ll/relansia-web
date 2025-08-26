// app/api/reminders/send-now/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getUserIdOrDev } from "@/lib/auth";
import { sendViaProvider } from "@/lib/providers/channels";
import { nowISO, errorJSON } from "@/lib/logging";

type Channel = "email" | "sms" | "whatsapp";

type ClientRow = {
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
};

// Type local pour l'objet envoyé au provider (champ first_name/last_name optionnels)
type ProviderPayload = {
  id: string;
  channel: Channel;
  message: string;
  client: {
    email: string | null;
    phone: string | null;
    first_name?: string | null;
    last_name?: string | null;
  };
};

export async function POST(req: Request) {
  try {
    const userId = getUserIdOrDev();
    const body = await req.json();
    const id: string | undefined = body?.id;
    if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

    // 1) Récupération du reminder + tentative de jointure client
    const { data: r, error } = await supabaseServer
      .from("reminders")
      .select(
        `
        id, user_id, client_id, channel, message, status,
        clients:client_id ( email, phone, first_name, last_name )
      `
      )
      .eq("user_id", userId)
      .eq("id", id)
      .single();

    if (error || !r) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const channel = r.channel as Channel;

    // 2) Jointure typée en douceur (peut être absente si FK non configurée)
    let client: ClientRow | null = (r as any).clients
      ? {
          email: (r as any).clients.email ?? null,
          phone: (r as any).clients.phone ?? null,
          first_name: (r as any).clients.first_name ?? null,
          last_name: (r as any).clients.last_name ?? null,
        }
      : null;

    // 3) Si pas de jointure, récupérer le client via une requête dédiée
    if (!client) {
      const { data: c, error: cErr } = await supabaseServer
        .from("clients")
        .select("email, phone, first_name, last_name")
        .eq("user_id", userId)
        .eq("id", r.client_id)
        .single();

      if (cErr) {
        const code = "client_fetch_error";
        await supabaseServer.from("dispatch_logs").insert({
          user_id: userId,
          reminder_id: id,
          channel,
          status: "failed",
          provider_id: null,
          error_detail: { code, message: cErr.message || "Client fetch failed" },
        });
        return NextResponse.json({ ok: false, error: code }, { status: 500 });
      }

      client = {
        email: c?.email ?? null,
        phone: c?.phone ?? null,
        first_name: c?.first_name ?? null,
        last_name: c?.last_name ?? null,
      };
    }

    // 4) Toujours pas de client ? → erreur claire
    if (!client) {
      const code = "client_not_found";
      await supabaseServer
        .from("reminders")
        .update({
          status: "failed",
          last_error_code: code,
          last_error: errorJSON(code, "Client not found"),
          last_attempt_at: nowISO(),
        })
        .eq("id", id);

      await supabaseServer.from("dispatch_logs").insert({
        user_id: userId,
        reminder_id: id,
        channel,
        status: "failed",
        provider_id: null,
        error_detail: { code, message: "Client not found" },
      });

      return NextResponse.json({ ok: false, error: code }, { status: 404 });
    }

    // 5) Vérifier le destinataire requis selon le canal
    const missingRecipient =
      (channel === "email" && !client.email) ||
      ((channel === "sms" || channel === "whatsapp") && !client.phone);

    if (missingRecipient) {
      const code = "missing_recipient";
      await supabaseServer
        .from("reminders")
        .update({
          status: "failed",
          last_error_code: code,
          last_error: errorJSON(code, "Recipient (email/phone) is missing for this channel"),
          last_attempt_at: nowISO(),
        })
        .eq("id", id);

      await supabaseServer.from("dispatch_logs").insert({
        user_id: userId,
        reminder_id: id,
        channel,
        status: "failed",
        provider_id: null,
        error_detail: { code, message: "Recipient (email/phone) is missing for this channel" },
      });

      return NextResponse.json({ ok: false, error: code }, { status: 400 });
    }

    // 6) Passer en "sending" avant l'appel provider
    await supabaseServer
      .from("reminders")
      .update({ status: "sending", last_attempt_at: nowISO() })
      .eq("id", id);

    // 7) Construire un client "safe" qui satisfait explicitement le type
    const safeClient: ProviderPayload["client"] = {
      email: client.email ?? null,
      phone: client.phone ?? null,
      // first_name / last_name sont OPTIONNELS pour le provider
      first_name: client.first_name ?? null,
      last_name: client.last_name ?? null,
    };

    // 8) Envoi via provider (server-only)
    const res = await sendViaProvider(channel, {
      id: r.id,
      channel,
      message: r.message,
      client: safeClient,
    } as ProviderPayload); // on cast au type local pour lever toute ambiguïté TS

    if (res.ok) {
      await supabaseServer
        .from("reminders")
        .update({
          status: "sent",
          sent_at: res.at ?? nowISO(),
          last_error_code: null,
          last_error: null,
        })
        .eq("id", id);

      await supabaseServer.from("dispatch_logs").insert({
        user_id: userId,
        reminder_id: id,
        channel,
        status: "success",
        provider_id: res.providerId ?? null,
        error_detail: null,
      });

      return NextResponse.json({ ok: true, providerId: res.providerId ?? null });
    } else {
      await supabaseServer
        .from("reminders")
        .update({
          status: "failed",
          last_error_code: res.error,
          last_error: errorJSON(res.error, res.detail || res.error),
        })
        .eq("id", id);

      await supabaseServer.from("dispatch_logs").insert({
        user_id: userId,
        reminder_id: id,
        channel,
        status: "failed",
        provider_id: null,
        error_detail: { code: res.error, message: res.detail || res.error },
      });

      return NextResponse.json({ ok: false, error: res.error }, { status: 500 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "send_now error" }, { status: 500 });
  }
}
