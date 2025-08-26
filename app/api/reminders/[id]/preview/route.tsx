// app/api/reminders/[id]/preview/route.tsx
import * as React from "react";
import { NextResponse } from "next/server";
import { render } from "@react-email/render";
import ReminderEmail from "@/emails/ReminderEmail";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const reactEmail = (
    <ReminderEmail
      subject={`[Preview] ${params.id}`}
      previewText="Prévisualisation"
      storeName="Relansia Demo Shop"
      senderName="Relansia"
      firstName={"Camille"}
      message={"Aperçu du template HTML ✅"}
      offerUrl={null}
      signature="L’équipe Relansia"
      logoUrl={null}
      unsubscribeUrl={`https://relansia-web.vercel.app/api/unsub/${params.id}`}
    />
  );

  const html = await render(reactEmail, { pretty: true });
  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}
