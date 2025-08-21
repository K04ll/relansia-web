import { NextResponse } from "next/server";
import { getUserIdOrDev } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase-server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

type Body = {
  channel: "email" | "sms" | "whatsapp";
  first_name?: string | null;
  last_name?: string | null;
  product?: string | null;
  purchased_at?: string | null;
  shopName?: string | null;
  signature?: string | null;
  delayDays?: number | null;
};

export async function POST(req: Request) {
  try {
    const userId = getUserIdOrDev();
    const body = (await req.json()) as Body;

    if (!body?.channel) {
      return NextResponse.json({ error: "channel requis" }, { status: 400 });
    }

    // Charger settings (nom boutique, signature)
    const { data: settings } = await supabaseServer
      .from("settings")
      .select("shop_name, signature, default_channel")
      .eq("user_id", userId)
      .single();

    const shop = body.shopName ?? settings?.shop_name ?? "Votre boutique";
    const sign = body.signature ?? settings?.signature ?? "";

    const parts = [
      `Tu es un assistant marketing.`,
      `Objectif: générer un message de relance ${body.channel.toUpperCase()} court, clair, personnalisé.`,
      `Données:`,
      `- Prénom: ${body.first_name ?? ""}`,
      `- Nom: ${body.last_name ?? ""}`,
      `- Produit: ${body.product ?? ""}`,
      `- Date d'achat: ${body.purchased_at ?? ""}`,
      `- Délai (jours): ${body.delayDays ?? ""}`,
      `- Boutique: ${shop}`,
      `- Signature: ${sign}`,
      ``,
      `Contraintes:`,
      `- EMAIL: ton, pro & chaleureux, 120–180 mots max, paragraphe clair, CTA simple.`,
      `- SMS: 140 caractères environ, direct, avec lien/CTA si pertinent.`,
      `- WHATSAPP: amical, possibilité d’emoji modérée, 60–120 mots.`,
      `- Jamais inventer d’info (prix, réductions).`,
      `- Langue: FR.`,
    ].join("\n");

    const { choices } = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: parts }, { role: "user", content: "Rédige le message maintenant." }],
      temperature: 0.7,
      max_tokens: 350,
    });

    const message = choices?.[0]?.message?.content?.trim() || "";
    if (!message) {
      return NextResponse.json({ error: "IA: message vide" }, { status: 500 });
    }
    return NextResponse.json({ message });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "gen error" }, { status: 500 });
  }
}
