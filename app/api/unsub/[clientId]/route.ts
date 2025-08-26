import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(
  req: Request,
  { params }: { params: { clientId: string } }
) {
  const { clientId } = params;

  const { error } = await supabase
    .from("clients")
    .update({ unsubscribed: true })
    .eq("id", clientId);

  if (error) {
    return NextResponse.json({ success: false, error: error.message });
  }

  return new NextResponse(
    `<html><body style="font-family:sans-serif;text-align:center;padding:50px">
       <h1>Vous êtes désabonné ✅</h1>
       <p>Vous ne recevrez plus de rappels par email.</p>
     </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
